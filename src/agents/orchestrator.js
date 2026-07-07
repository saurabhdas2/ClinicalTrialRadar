/**
 * @file orchestrator.js
 * @description Master Orchestrator Agent for Clinical Trial Radar.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * AGENT ARCHITECTURE: Multi-Agent Orchestration Pattern
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This module implements a ReAct (Reason + Act) style Orchestrator that:
 *
 *   1. PERCEIVES  — Receives a natural-language query from the user
 *   2. REASONS    — Classifies intent and builds an execution plan (tool call sequence)
 *   3. ACTS       — Executes tools in sequence (or in parallel where safe)
 *   4. REFLECTS   — Annotates results with reasoning steps for transparency
 *   5. RESPONDS   — Returns structured data + step log to the UI layer
 *
 * AGENT GRAPH:
 *
 *   User Query
 *       │
 *       ▼
 *   ┌─────────────────────────────────────────┐
 *   │          OrchestratorAgent              │
 *   │  • Intent Classification (NLP)          │
 *   │  • Entity Extraction                    │
 *   │  • Execution Plan Construction          │
 *   │  • Memory Context Loading               │
 *   └──────────────┬──────────────────────────┘
 *                  │ routes to →
 *        ┌─────────┼──────────────────────────┐
 *        │         │          │               │
 *        ▼         ▼          ▼               ▼
 *   TrialSearch  Eligibility  DrugIntel   CompanyPipeline
 *   Sub-Agent    Sub-Agent    Sub-Agent   Sub-Agent
 *        │         │          │               │
 *        └─────────┴──────────┴───────────────┘
 *                  │
 *                  ▼
 *          Tool Registry (executeTool)
 *                  │
 *        ┌─────────┴──────────────────┐
 *        │                            │
 *        ▼                            ▼
 *  ClinicalTrials.gov V2        OpenFDA Drug API
 *  (with mock fallback)         (with mock fallback)
 *
 * REASONING STEPS:
 *   The orchestrator emits a `steps[]` array that the UI renders as a
 *   real-time "thinking log". This makes the agent's reasoning transparent
 *   and auditable — a key requirement for clinical/medical applications
 *   where users must be able to verify the agent's data sources.
 *
 * MEMORY INTEGRATION:
 *   The Orchestrator reads from and writes to agentMemory on every turn,
 *   enabling multi-turn conversations and context carry-over.
 *
 * EXTENSIBILITY:
 *   Intent classification is currently rule-based (deterministic). It can be
 *   replaced with an LLM call (e.g., Gemini 1.5 Flash, GPT-4o-mini) that
 *   returns a JSON object { intent, entities } — the rest of the pipeline
 *   remains unchanged. The tool registry is already LLM function-calling
 *   compatible (name + description + parameter schema).
 */

import { executeTool } from './toolRegistry';
import {
  addTurn,
  updateEntity,
  getEntity,
  savePatientProfile,
  getPatientProfile,
  getMemorySnapshot
} from './agentMemory';

// ---------------------------------------------------------------------------
// INTENT CLASSIFICATION
// ---------------------------------------------------------------------------

/**
 * INTENT_PATTERNS
 * Ordered list of intent matchers. Each entry has:
 *   - intent:   string identifier returned to sub-agents
 *   - priority: lower = checked first (more specific patterns have lower priority numbers)
 *   - matches:  function(query) → boolean
 *
 * ORDER MATTERS: 'drug_compare' must be checked before 'drug_search'
 * because "compare Advil and Tylenol" would match both patterns.
 */
const INTENT_PATTERNS = [
  {
    intent: 'drug_compare',
    priority: 1,
    // Matches: "compare X and Y", "X vs Y side effects", "difference between X and Y"
    matches: (q) => /\bcompare\b/.test(q) || (/\bvs\.?\b/.test(q) && /\bdrug|medicine|pill\b/.test(q)) ||
                    (q.includes(' and ') && /\bside.?effect|adverse|warning\b/.test(q))
  },
  {
    intent: 'drug_search',
    priority: 2,
    // Matches: "search drug X", "FDA label for Y", "side effects of Z", "ingredients in..."
    matches: (q) => /\bfda\b|drug label|side.?effect|ingredient|brand name|generic name|medicine|medication|pill|tablet\b/.test(q)
  },
  {
    intent: 'eligibility_check',
    priority: 3,
    // Matches: "am I eligible", "can I enroll", "do I qualify", "68 years old ... trial"
    matches: (q) => /\beligib|enrol|qualify|am i|can i join|do i meet\b/.test(q) ||
                    (/\d+\s*(year|yr|yo)/.test(q) && /\btrial\b/.test(q))
  },
  {
    intent: 'company_insights',
    priority: 4,
    // Matches: "Pfizer pipeline", "AstraZeneca metrics", "show portfolio for..."
    matches: (q) => /\bpipeline|portfolio|metrics|timeline|company.?wise|show me.*(?:pfizer|novartis|roche|merck|moderna|astrazeneca)\b/.test(q) ||
                    /\b(?:pfizer|novartis|roche|merck|moderna|astrazeneca)\b/.test(q) && /\btrial|study|pipeline|drug\b/.test(q)
  },
  {
    intent: 'trial_search',
    priority: 5,
    // Default: catches remaining clinical research queries
    matches: () => true // Always matches — serves as the fallback
  }
];

/**
 * classifyIntent(query)
 * Runs the query through INTENT_PATTERNS in priority order and returns the
 * first matching intent. This is the "perception" phase of the ReAct loop.
 *
 * @param {string} query - Lowercased user query
 * @returns {string} Intent identifier
 */
const classifyIntent = (query) => {
  const sorted = [...INTENT_PATTERNS].sort((a, b) => a.priority - b.priority);
  for (const pattern of sorted) {
    if (pattern.matches(query)) return pattern.intent;
  }
  return 'trial_search'; // Unreachable but safe default
};

// ---------------------------------------------------------------------------
// ENTITY EXTRACTION
// ---------------------------------------------------------------------------

/**
 * extractEntities(query)
 * Lightweight NER (Named Entity Recognition) using keyword dictionaries.
 * Returns all recognized entities in the query for use in tool arguments.
 *
 * ENTITIES EXTRACTED:
 *   - sponsor:    pharma company names
 *   - phase:      trial phase numbers
 *   - status:     enrollment status keywords
 *   - drugs:      up to 2 drug names for comparison
 *   - company:    company name for insights queries
 *   - condition:  disease/condition keywords
 *
 * @param {string} query - User query (lowercased)
 * @returns {object} Extracted entity map
 */
const extractEntities = (query) => {
  const entities = {};

  // ── Sponsor / Company ───────────────────────────────────────────────────
  const KNOWN_SPONSORS = [
    'pfizer', 'novartis', 'roche', 'merck', 'moderna', 'astrazeneca',
    'eli lilly', 'johnson', 'bayer', 'gilead', 'biogen', 'abbvie',
    'bristol', 'sanofi', 'boehringer', 'eisai', 'regeneron'
  ];
  const matchedSponsor = KNOWN_SPONSORS.find(s => query.includes(s));
  if (matchedSponsor) {
    entities.sponsor = matchedSponsor;
    entities.company = matchedSponsor.charAt(0).toUpperCase() + matchedSponsor.slice(1);
  }

  // ── Trial Phase ──────────────────────────────────────────────────────────
  if      (/phase\s*(?:1|i)\b/.test(query)) entities.phase = 'PHASE1';
  else if (/phase\s*(?:2|ii)\b/.test(query)) entities.phase = 'PHASE2';
  else if (/phase\s*(?:3|iii)\b/.test(query)) entities.phase = 'PHASE3';
  else if (/phase\s*(?:4|iv)\b/.test(query)) entities.phase = 'PHASE4';

  // ── Enrollment Status ────────────────────────────────────────────────────
  if      (/\bcompleted?\b/.test(query))           entities.status = 'COMPLETED';
  else if (/\brecruiting\b/.test(query))           entities.status = 'RECRUITING';
  else if (/\bactive\b/.test(query))               entities.status = 'RECRUITING';
  else if (/\bterminated?\b/.test(query))          entities.status = 'TERMINATED';

  // ── Disease / Condition ──────────────────────────────────────────────────
  const CONDITION_PATTERNS = [
    { pattern: /alzheimer/,                 condition: 'Alzheimer' },
    { pattern: /breast\s*cancer/,           condition: 'Breast Cancer' },
    { pattern: /lung\s*cancer/,             condition: 'Lung Cancer' },
    { pattern: /prostate\s*cancer/,         condition: 'Prostate Cancer' },
    { pattern: /leukemia/,                  condition: 'Leukemia' },
    { pattern: /lymphoma/,                  condition: 'Lymphoma' },
    { pattern: /melanoma/,                  condition: 'Melanoma' },
    { pattern: /\bcancer\b/,               condition: 'Cancer' },
    { pattern: /\btumou?r\b/,              condition: 'Tumor' },
    { pattern: /diabetes/,                  condition: 'Diabetes' },
    { pattern: /heart\s*failure/,           condition: 'Heart Failure' },
    { pattern: /covid/,                     condition: 'COVID-19' },
    { pattern: /\bstroke\b/,               condition: 'Stroke' },
    { pattern: /parkinson/,                 condition: 'Parkinson' },
    { pattern: /kidney|renal/,             condition: 'Kidney Disease' },
    { pattern: /obesity/,                   condition: 'Obesity' },
    { pattern: /rheumatoid|arthritis/,      condition: 'Rheumatoid Arthritis' },
    { pattern: /multiple\s*sclerosis|ms\b/, condition: 'Multiple Sclerosis' }
  ];
  const matchedCondition = CONDITION_PATTERNS.find(({ pattern }) => pattern.test(query));
  if (matchedCondition) entities.condition = matchedCondition.condition;

  // ── Drug Names (for comparison queries) ─────────────────────────────────
  // Extract drug names from "compare X and Y" or "X vs Y" patterns
  const compareMatch = query.match(/compare\s+([\w\s]+?)\s+(?:and|vs\.?)\s+([\w\s]+?)(?:\s+side|$)/i)
                    || query.match(/([\w]+)\s+vs\.?\s+([\w]+)/i);
  if (compareMatch) {
    entities.drug1 = compareMatch[1].trim();
    entities.drug2 = compareMatch[2].trim();
  }

  // ── Single Drug Name ─────────────────────────────────────────────────────
  // Strip common command words and extract the remaining as drug name
  if (!entities.drug1) {
    const drugQuery = query
      .replace(/\b(drug|search|fda|label|for|the|show|me|what|are|side|effects?|of|ingredients?|in|brand|generic|name)\b/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (drugQuery.length > 2) entities.drugQuery = drugQuery;
  }

  return entities;
};

// ---------------------------------------------------------------------------
// EXECUTION PLAN BUILDER
// ---------------------------------------------------------------------------

/**
 * buildExecutionPlan(intent, entities, query)
 * Constructs an ordered list of tool calls to execute for the given intent.
 * Each step specifies: { tool: string, args: object, description: string }
 *
 * This is the "planning" phase of the ReAct loop — the orchestrator decides
 * WHAT to do before actually doing it, allowing for step-by-step transparency.
 *
 * @param {string} intent   - Classified intent
 * @param {object} entities - Extracted entities
 * @param {string} query    - Original query
 * @returns {Array} Ordered execution plan steps
 */
const buildExecutionPlan = (intent, entities, query) => {
  switch (intent) {

    case 'trial_search':
      return [
        {
          tool: 'search_clinical_trials',
          args: {
            keyword:   entities.condition || getEntity('lastCondition') || query.substring(0, 50),
            sponsor:   entities.sponsor   || getEntity('lastSponsor'),
            phase:     entities.phase     || getEntity('lastPhase'),
            status:    entities.status,
            limit: 8
          },
          description: `Querying ClinicalTrials.gov V2 with filters: ${JSON.stringify({ condition: entities.condition, sponsor: entities.sponsor, phase: entities.phase })}`
        },
        {
          tool: 'rank_trials_by_relevance',
          args: { query },
          description: 'Re-ranking results by relevance to user query'
        },
        {
          tool: 'summarize_trial_landscape',
          args: {},
          description: 'Generating statistical landscape summary'
        }
      ];

    case 'eligibility_check':
      return [
        {
          tool: 'parse_patient_profile',
          args: { text: query },
          description: 'Extracting structured patient profile from natural language'
        },
        {
          tool: 'search_clinical_trials',
          args: {
            keyword: entities.condition || getEntity('lastCondition') || 'cancer',
            status: 'RECRUITING',
            limit: 6
          },
          description: 'Fetching active recruiting trials for eligibility assessment'
        },
        {
          tool: 'score_eligibility',
          args: {},
          description: 'Running eligibility matrix: age gate → gender gate → condition alignment → exclusion scan'
        }
      ];

    case 'drug_compare':
      return [
        {
          tool: 'compare_drugs',
          args: {
            drug1: entities.drug1 || getEntity('lastDrug') || 'Advil',
            drug2: entities.drug2 || 'Tylenol'
          },
          description: `Parallel-fetching FDA labels for ${entities.drug1 || 'Drug 1'} and ${entities.drug2 || 'Drug 2'}`
        }
      ];

    case 'drug_search':
      return [
        {
          tool: 'search_fda_label',
          args: {
            query: entities.drugQuery || entities.condition || getEntity('lastDrug') || query,
            limit: 5
          },
          description: `Querying OpenFDA Drug Label API for: "${entities.drugQuery || query}"`
        }
      ];

    case 'company_insights':
      return [
        {
          tool: 'get_company_pipeline',
          args: {
            company: entities.company || getEntity('lastCompany') || 'Pfizer'
          },
          description: `Retrieving pipeline analytics for ${entities.company || 'the company'}`
        }
      ];

    default:
      return [];
  }
};

// ---------------------------------------------------------------------------
// STEP EMITTER
// ---------------------------------------------------------------------------

/**
 * emit(steps, text)
 * Adds a timestamped reasoning step to the steps array.
 * The UI subscribes to these steps and streams them in real-time
 * with 800ms delay between steps to simulate live agent thinking.
 *
 * @param {Array}  steps - Mutable steps array (passed by reference)
 * @param {string} text  - Human-readable step description
 */
const emit = (steps, text) => steps.push({
  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  text
});

// ---------------------------------------------------------------------------
// ORCHESTRATOR — MAIN ENTRY POINT
// ---------------------------------------------------------------------------

/**
 * runOrchestrator(queryText)
 * Main entry point for the multi-agent system. Implements the full ReAct loop:
 *   Perceive → Classify → Plan → Execute → Reflect → Respond
 *
 * This is the function called by AgentPanel.jsx on every user message.
 *
 * @param {string} queryText - Raw user query
 * @returns {Promise<{intent, steps, data, filters?, profile?, company?, searchQuery?}>}
 */
export const runOrchestrator = async (queryText) => {
  const query = queryText.toLowerCase().trim();
  const steps = [];

  // ── STEP 1: PERCEPTION ──────────────────────────────────────────────────
  emit(steps, `🔍 Parsing query: "${queryText.substring(0, 80)}${queryText.length > 80 ? '…' : ''}"`);

  // Add user turn to conversation memory
  addTurn({ role: 'user', content: queryText });

  // Log current memory context for debugging
  const memSnap = getMemorySnapshot();
  if (memSnap.turnCount > 1) {
    emit(steps, `🧠 Memory: ${memSnap.turnCount} prior turns · Entities: ${Object.entries(memSnap.entities).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join(', ') || 'none'}`);
  }

  // ── STEP 2: INTENT CLASSIFICATION ───────────────────────────────────────
  const intent = classifyIntent(query);
  emit(steps, `🎯 Intent classified: ${intent.toUpperCase().replace(/_/g, ' ')}`);

  // ── STEP 3: ENTITY EXTRACTION ────────────────────────────────────────────
  const entities = extractEntities(query);
  const entitySummary = Object.entries(entities).filter(([,v]) => v).map(([k,v]) => `${k}="${v}"`).join(', ');
  if (entitySummary) {
    emit(steps, `🏷️  Entities extracted: ${entitySummary}`);
  }

  // Update memory with newly extracted entities
  if (entities.condition) updateEntity('lastCondition', entities.condition);
  if (entities.sponsor)   updateEntity('lastSponsor',   entities.sponsor);
  if (entities.drug1)     updateEntity('lastDrug',      entities.drug1);
  if (entities.company)   updateEntity('lastCompany',   entities.company);
  if (entities.phase)     updateEntity('lastPhase',     entities.phase);

  // ── STEP 4: EXECUTION PLANNING ───────────────────────────────────────────
  const plan = buildExecutionPlan(intent, entities, query);
  emit(steps, `📋 Execution plan: ${plan.length} tool call${plan.length > 1 ? 's' : ''} scheduled`);

  // ── STEP 5: TOOL EXECUTION (ReAct loop) ──────────────────────────────────
  // We carry intermediate results forward: the output of tool N can be used
  // as input to tool N+1 (piping pattern). This is the "Act" phase.
  let trialResults   = null;
  let patientProfile = null;
  let drugResult     = null;
  let companyResult  = null;
  let summary        = null;

  for (const step of plan) {
    emit(steps, `⚙️  Executing tool: ${step.tool} — ${step.description}`);

    // PIPE: inject intermediate results into tool args
    let args = { ...step.args };
    if (step.tool === 'rank_trials_by_relevance' && trialResults) {
      args.trials = trialResults;
    }
    if (step.tool === 'score_eligibility' && trialResults && patientProfile) {
      args.trials  = trialResults;
      args.profile = patientProfile;
    }
    if (step.tool === 'summarize_trial_landscape' && trialResults) {
      args.trials = trialResults;
    }

    // Execute the tool via the registry
    const { success, result, error } = await executeTool(step.tool, args);

    if (!success) {
      emit(steps, `⚠️  Tool ${step.tool} failed: ${error}. Attempting recovery...`);
      continue; // Skip failed step but continue with remaining plan
    }

    // Store results for piping to next steps and final response
    if (step.tool === 'search_clinical_trials')      trialResults   = result;
    if (step.tool === 'rank_trials_by_relevance')    trialResults   = result;
    if (step.tool === 'parse_patient_profile')       { patientProfile = result; savePatientProfile(result); }
    if (step.tool === 'compare_drugs')               drugResult     = result;
    if (step.tool === 'search_fda_label')            drugResult     = result;
    if (step.tool === 'get_company_pipeline')        companyResult  = result;
    if (step.tool === 'summarize_trial_landscape')   summary        = result;

    // Emit a result summary for the step
    if (step.tool === 'search_clinical_trials' && result) {
      emit(steps, `✅ ClinicalTrials.gov returned ${result.length} studies`);
    } else if (step.tool === 'search_fda_label' && result) {
      emit(steps, `✅ OpenFDA returned ${result.length} drug label record${result.length !== 1 ? 's' : ''}`);
    } else if (step.tool === 'parse_patient_profile' && result) {
      emit(steps, `👤 Patient profile: Age ${result.age}, ${result.gender}, Condition: "${result.conditions[0]}"`);
    } else if (step.tool === 'score_eligibility' && result) {
      const eligible = result.filter(r => r.status === 'ELIGIBLE').length;
      const partial  = result.filter(r => r.status === 'PARTIAL').length;
      emit(steps, `🩺 Eligibility scored: ${eligible} Eligible · ${partial} Partial · ${result.length - eligible - partial} Ineligible`);
    } else if (step.tool === 'get_company_pipeline' && result) {
      emit(steps, `📊 Pipeline data loaded for ${result.name}`);
    } else if (step.tool === 'compare_drugs' && result) {
      emit(steps, `💊 Drug labels loaded for ${result.drug1?.brandName || 'Drug 1'} and ${result.drug2?.brandName || 'Drug 2'}`);
    }
  }

  // ── STEP 6: REFLECTION ───────────────────────────────────────────────────
  // Summarize what the agent accomplished and add the agent turn to memory
  if (summary) {
    emit(steps, `📈 Landscape summary: ${summary.total} trials · Top areas: ${Object.entries(summary.byTherapeuticArea || {}).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${k}(${v})`).join(', ')}`);
  }

  emit(steps, `✔️  Agent response ready`);

  // Record agent turn in memory
  addTurn({ role: 'agent', content: `Completed ${intent} with ${plan.length} tool calls` });

  // ── STEP 7: STRUCTURED RESPONSE ─────────────────────────────────────────
  // Return a typed response object. The UI (AgentPanel.jsx) uses `intent`
  // to determine which widget to render for the data payload.
  return {
    intent,
    steps,
    filters:     entities,
    profile:     patientProfile || getPatientProfile(),
    company:     companyResult?.name,
    searchQuery: entities.drugQuery || entities.drugQuery,
    data: (() => {
      // Build final data payload based on intent
      switch (intent) {
        case 'trial_search':      return trialResults || [];
        case 'eligibility_check':
          // score_eligibility result is stored in trialResults when piped
          if (Array.isArray(trialResults) && trialResults[0]?.status) return trialResults;
          return [];
        case 'drug_compare':      return drugResult   || {};
        case 'drug_search':       return drugResult   || [];
        case 'company_insights':  return companyResult || {};
        default:                  return null;
      }
    })()
  };
};
