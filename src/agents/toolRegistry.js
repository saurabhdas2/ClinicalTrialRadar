/**
 * @file toolRegistry.js
 * @description Central registry of all agent-callable tools in Clinical Trial Radar.
 *
 * DESIGN: This module implements the "Tool-Augmented Agent" pattern — each tool is
 * a structured, named function with a typed schema (name, description, parameters).
 * The Orchestrator Agent consults this registry when deciding which tools to invoke
 * for a given sub-agent execution plan.
 *
 * Each tool follows the OpenAI function-calling schema convention (name, description,
 * parameters) so this architecture can be trivially upgraded to wire real LLM function
 * calling (e.g., GPT-4o, Gemini 1.5) by replacing the intent engine with an LLM call
 * that returns tool_calls[], while keeping all tool implementations unchanged.
 *
 * TOOL CATEGORIES:
 *  - Clinical Data Tools  → ClinicalTrials.gov V2 API
 *  - Drug Intelligence Tools → OpenFDA Drug Label API
 *  - Eligibility Tools    → Client-side criteria scoring engine
 *  - Analytics Tools      → Company pipeline computations
 */

import {
  fetchClinicalTrials,
  fetchStudyDetails,
  fetchOpenFDADrug,
  fetchCompanyMetrics
} from '../services/apiService';
import { evaluateEligibility, parseAgeToYears } from './eligibilityAgent';

// ---------------------------------------------------------------------------
// TOOL DEFINITIONS
// Each entry has:
//   name        - unique tool identifier (snake_case)
//   description - natural-language description consumed by the orchestrator
//   parameters  - typed schema for arguments (JSON Schema subset)
//   execute     - async function that runs the tool and returns structured result
// ---------------------------------------------------------------------------

export const TOOL_REGISTRY = {

  // ─── CLINICAL TRIAL TOOLS ────────────────────────────────────────────────

  /**
   * search_clinical_trials
   * Calls the ClinicalTrials.gov V2 REST API with structured filters.
   * Falls back to local mock data if the live API is unavailable (rate-limited,
   * CORS-blocked, or network failure) — ensuring zero blank-state UX.
   */
  search_clinical_trials: {
    name: 'search_clinical_trials',
    description: 'Search ClinicalTrials.gov V2 for studies matching keyword, condition, sponsor, phase, and status filters.',
    parameters: {
      type: 'object',
      properties: {
        keyword:   { type: 'string',  description: 'Free-text keyword for condition or intervention name' },
        condition: { type: 'string',  description: 'Specific disease/condition name (e.g., "breast cancer")' },
        sponsor:   { type: 'string',  description: 'Lead sponsor company name (e.g., "Pfizer")' },
        phase:     { type: 'string',  enum: ['PHASE1', 'PHASE2', 'PHASE3', 'PHASE4'], description: 'Trial phase filter' },
        status:    { type: 'string',  enum: ['RECRUITING', 'ACTIVE_NOT_RECRUITING', 'COMPLETED', 'ALL'], description: 'Enrollment status filter' },
        limit:     { type: 'integer', description: 'Maximum number of results to return', default: 10 }
      },
      required: []
    },
    execute: async (args) => {
      const results = await fetchClinicalTrials(args);
      return results.slice(0, args.limit || 10);
    }
  },

  /**
   * get_trial_details
   * Fetches full protocol details for a specific trial by NCT ID.
   */
  get_trial_details: {
    name: 'get_trial_details',
    description: 'Retrieve full protocol details for a single clinical trial by its NCT identifier.',
    parameters: {
      type: 'object',
      properties: {
        nctId: { type: 'string', description: 'NCT identifier (e.g., "NCT06182944")' }
      },
      required: ['nctId']
    },
    execute: async ({ nctId }) => fetchStudyDetails(nctId)
  },

  /**
   * rank_trials_by_relevance
   * Pure client-side ranking — no API call needed. Scores trials by
   * keyword match density in title, summary, and conditions fields.
   * Uses a simple TF-like frequency count as the relevance signal.
   */
  rank_trials_by_relevance: {
    name: 'rank_trials_by_relevance',
    description: 'Re-rank a list of trials by text relevance to the user\'s query.',
    parameters: {
      type: 'object',
      properties: {
        trials: { type: 'array',  description: 'Array of unified trial objects to rank' },
        query:  { type: 'string', description: 'The search query string to rank against' }
      },
      required: ['trials', 'query']
    },
    execute: async ({ trials, query }) => {
      const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
      return trials
        .map(trial => {
          const corpus = `${trial.title} ${trial.summary} ${trial.conditions.join(' ')}`.toLowerCase();
          // Count term frequency across the trial corpus text
          const score = terms.reduce((acc, term) => {
            const matches = (corpus.match(new RegExp(term, 'g')) || []).length;
            return acc + matches;
          }, 0);
          return { ...trial, _relevanceScore: score };
        })
        .sort((a, b) => b._relevanceScore - a._relevanceScore);
    }
  },

  // ─── DRUG INTELLIGENCE TOOLS ─────────────────────────────────────────────

  /**
   * search_fda_label
   * Queries the OpenFDA Drug Label API for FDA-approved drug information.
   * The search logic covers brand name, generic name, active ingredient,
   * and manufacturer — matching the FDA's actual label index fields.
   */
  search_fda_label: {
    name: 'search_fda_label',
    description: 'Search OpenFDA drug label database for approved drug records including warnings, side effects, and dosage.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Drug brand name, generic name, or active ingredient to search' },
        limit: { type: 'integer', description: 'Maximum results to return', default: 5 }
      },
      required: ['query']
    },
    execute: async ({ query, limit = 5 }) => {
      const results = await fetchOpenFDADrug(query);
      return results.slice(0, limit);
    }
  },

  /**
   * compare_drugs
   * Parallel-fetches two drug labels and structures them for side-by-side
   * comparison. Uses Promise.all for concurrent API calls to minimize latency.
   */
  compare_drugs: {
    name: 'compare_drugs',
    description: 'Compare two drugs side-by-side across all FDA label attributes.',
    parameters: {
      type: 'object',
      properties: {
        drug1: { type: 'string', description: 'First drug name (brand or generic)' },
        drug2: { type: 'string', description: 'Second drug name (brand or generic)' }
      },
      required: ['drug1', 'drug2']
    },
    execute: async ({ drug1, drug2 }) => {
      // Parallel fetch for minimum latency
      const [results1, results2] = await Promise.all([
        fetchOpenFDADrug(drug1),
        fetchOpenFDADrug(drug2)
      ]);
      return {
        drug1: results1[0] || { brandName: drug1, notFound: true },
        drug2: results2[0] || { brandName: drug2, notFound: true }
      };
    }
  },

  // ─── ELIGIBILITY TOOLS ───────────────────────────────────────────────────

  /**
   * parse_patient_profile
   * Extracts a structured patient profile from unstructured natural language text.
   * Uses regex and keyword matching — a deterministic NER approach that avoids
   * any LLM dependency and runs instantly on the client.
   */
  parse_patient_profile: {
    name: 'parse_patient_profile',
    description: 'Extract structured patient profile (age, gender, condition) from free-text query.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Natural language text describing the patient\'s situation' }
      },
      required: ['text']
    },
    execute: async ({ text }) => {
      const lower = text.toLowerCase();

      // Age extraction — handles "68 years old", "age 68", "68-year-old"
      const ageMatch = lower.match(/(\d+)\s*(?:year|yr|yo|years?\s*old|-year-old)/);
      const age = ageMatch ? parseInt(ageMatch[1]) : 45;

      // Gender extraction — supports common natural language variants
      let gender = 'ALL';
      if (/\b(female|woman|women|lady|she|her)\b/.test(lower)) gender = 'FEMALE';
      else if (/\b(male|man|men|guy|he|his)\b/.test(lower))    gender = 'MALE';

      // Condition extraction — medical keyword dictionary
      const conditionKeywords = [
        'alzheimer', 'dementia', 'parkinson', 'cancer', 'tumor', 'oncology',
        'lung cancer', 'breast cancer', 'prostate cancer', 'leukemia', 'lymphoma',
        'heart failure', 'cardiac', 'cardiovascular', 'diabetes', 'obesity',
        'covid', 'infection', 'respiratory', 'kidney disease', 'renal', 'stroke'
      ];
      const matchedCondition = conditionKeywords.find(k => lower.includes(k)) || 'cancer';

      // Symptom extraction — comma-separated list after "symptoms" keyword
      const symptomsMatch = lower.match(/symptoms?\s*[:=]?\s*([^.]+)/);
      const symptoms = symptomsMatch ? symptomsMatch[1].trim() : '';

      return { age, gender, conditions: [matchedCondition], symptoms };
    }
  },

  /**
   * score_eligibility
   * Evaluates a patient profile against an array of clinical trials.
   * Returns each trial annotated with ELIGIBLE / PARTIAL / INELIGIBLE
   * plus human-readable reason strings for each criterion.
   *
   * ALGORITHM:
   *   1. Age range check (with unit normalization: years/months/weeks)
   *   2. Gender restriction check
   *   3. Condition keyword overlap scoring
   *   4. Free-text exclusion criteria scan for symptom/comorbidity conflicts
   */
  score_eligibility: {
    name: 'score_eligibility',
    description: 'Score a set of clinical trials for a patient\'s eligibility based on age, gender, condition, and exclusion criteria.',
    parameters: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          description: 'Patient profile with age (number), gender (string), conditions (string[]), symptoms (string)'
        },
        trials: {
          type: 'array',
          description: 'Array of clinical trial objects to evaluate'
        }
      },
      required: ['profile', 'trials']
    },
    execute: async ({ profile, trials }) => {
      return trials.map(trial => evaluateEligibility(trial, profile));
    }
  },

  // ─── ANALYTICS TOOLS ─────────────────────────────────────────────────────

  /**
   * get_company_pipeline
   * Returns a pharma company's clinical pipeline metrics: trial counts by year,
   * status distribution, phase breakdown, and therapeutic focus.
   * Uses curated real data for major sponsors; generates synthetic-but-plausible
   * data for any other company name via deterministic hash-based generation.
   */
  get_company_pipeline: {
    name: 'get_company_pipeline',
    description: 'Get clinical pipeline metrics for a pharmaceutical company: trial timelines, phase distribution, therapeutic areas, and approved drugs.',
    parameters: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Pharmaceutical company name (e.g., "Pfizer", "Roche", "Novartis")' }
      },
      required: ['company']
    },
    execute: async ({ company }) => fetchCompanyMetrics(company)
  },

  /**
   * summarize_trial_landscape
   * Aggregates a list of trials into a statistical summary: count by status,
   * count by phase, count by therapeutic area, and date range.
   * Pure computation — no API call needed. Used by the Orchestrator to
   * generate concise natural-language summaries in the agent response.
   */
  summarize_trial_landscape: {
    name: 'summarize_trial_landscape',
    description: 'Generate a statistical summary (counts by status, phase, therapeutic area) from a list of trials.',
    parameters: {
      type: 'object',
      properties: {
        trials: { type: 'array', description: 'List of unified trial objects' }
      },
      required: ['trials']
    },
    execute: async ({ trials }) => {
      const byStatus = {};
      const byPhase  = {};
      const byArea   = {};

      trials.forEach(t => {
        // Status distribution
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        // Phase distribution (a trial can be in multiple phases)
        (t.phases || []).forEach(p => { byPhase[p] = (byPhase[p] || 0) + 1; });
        // Therapeutic area distribution
        if (t.therapeuticArea) byArea[t.therapeuticArea] = (byArea[t.therapeuticArea] || 0) + 1;
      });

      return {
        total: trials.length,
        byStatus,
        byPhase,
        byTherapeuticArea: byArea,
        sponsors: [...new Set(trials.map(t => t.sponsor))].slice(0, 5)
      };
    }
  }
};

/**
 * getTool(name)
 * Retrieves a tool definition by name. Returns null if not found.
 * The Orchestrator uses this to validate tool calls before execution.
 *
 * @param {string} name - Tool name from TOOL_REGISTRY keys
 * @returns {object|null} Tool definition object or null
 */
export const getTool = (name) => TOOL_REGISTRY[name] || null;

/**
 * executeTool(name, args)
 * Executes a registered tool by name with the given arguments.
 * Wraps execution in error handling — failed tools return a structured
 * error result rather than throwing, so the agent can gracefully recover.
 *
 * @param {string} name - Tool name
 * @param {object} args - Arguments matching the tool's parameter schema
 * @returns {Promise<{success: boolean, result?: any, error?: string}>}
 */
export const executeTool = async (name, args) => {
  const tool = getTool(name);
  if (!tool) return { success: false, error: `Unknown tool: ${name}` };
  try {
    const result = await tool.execute(args);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
