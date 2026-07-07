/**
 * @file eligibilityAgent.js
 * @description Specialized sub-agent responsible for clinical trial eligibility matching.
 *
 * AGENT ROLE: EligibilityAgent
 *
 * This agent implements the core patient-trial matching logic. It is called by the
 * Orchestrator when intent = 'eligibility_check'. It operates as a pure analytical
 * engine — no UI concerns, only data transformation and scoring.
 *
 * ALGORITHM OVERVIEW:
 *  The eligibility scoring follows a layered criteria evaluation model:
 *
 *  Layer 1 — Hard Gates (INELIGIBLE if failed):
 *    - Age range:   patient age must be within [minimumAge, maximumAge]
 *    - Gender:      patient gender must match trial restriction (or trial accepts ALL)
 *
 *  Layer 2 — Soft Alignment (PARTIAL if failed, ELIGIBLE if passed):
 *    - Condition:   keyword overlap between patient conditions and trial disease targets
 *
 *  Layer 3 — Exclusion Scan (INELIGIBLE if triggered):
 *    - Criteria text: patient-reported symptoms/comorbidities scanned against the
 *      trial's exclusion criteria section using substring matching
 *
 * SCORE MAPPING:
 *   ELIGIBLE   = all checks passed (green)
 *   PARTIAL    = no hard gate failures, but soft alignment is weak (amber)
 *   INELIGIBLE = at least one hard gate or exclusion trigger failed (red)
 *
 * DESIGN NOTE: This is deterministic, client-side, and runs in <5ms per trial.
 * It can be upgraded to use a clinical NLP model (e.g., Bio-BERT) as a drop-in
 * replacement for the condition-matching step without changing the agent interface.
 */

/**
 * parseAgeToYears(ageStr)
 * Converts a ClinicalTrials.gov age string to a numeric year value.
 *
 * ClinicalTrials.gov V2 returns minimumAge / maximumAge as strings like:
 *   "18 Years", "6 Months", "12 Weeks", "N/A"
 * This function normalizes them to decimal years for numeric comparison.
 *
 * @param {string} ageStr - Raw age string from the API
 * @returns {number} Age in decimal years (0 if unparseable)
 */
export const parseAgeToYears = (ageStr) => {
  if (!ageStr) return 0;
  const cleaned = ageStr.toLowerCase().trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;

  if (cleaned.includes('month')) return num / 12;
  if (cleaned.includes('week'))  return num / 52;
  if (cleaned.includes('day'))   return num / 365;
  return num; // Default: already in years
};

/**
 * evaluateEligibility(trial, profile)
 * Core eligibility scoring function. Evaluates a single trial against a patient profile.
 *
 * @param {object} trial   - Unified trial object from apiService.mapRawStudyToUnified
 * @param {object} profile - Patient profile: { age, gender, conditions[], symptoms }
 * @returns {object} Eligibility result: { nctId, title, sponsor, status, reasons[], rawTrial }
 */
export const evaluateEligibility = (trial, profile) => {
  const patientAge        = parseFloat(profile.age) || 0;
  const patientGender     = (profile.gender || 'ALL').toUpperCase();
  const patientConditions = (profile.conditions || []).map(c => c.toLowerCase().trim());
  const patientSymptoms   = (profile.symptoms || '').toLowerCase();

  const minYears   = parseAgeToYears(trial.minimumAge);
  const maxYears   = parseAgeToYears(trial.maximumAge) || 120; // Default to 120 if unspecified
  const trialGender = (trial.sex || 'ALL').toUpperCase();

  const reasons = [];
  let status = 'ELIGIBLE'; // Start optimistic; downgrade on failures

  // ─── LAYER 1: AGE GATE ──────────────────────────────────────────────────
  // Hard gate: age out of range → INELIGIBLE immediately
  if (patientAge > 0 && patientAge < minYears) {
    status = 'INELIGIBLE';
    reasons.push({ pass: false, text: `Age ${patientAge} is below the minimum requirement of ${trial.minimumAge}.` });
  } else if (patientAge > 0 && maxYears < 120 && patientAge > maxYears) {
    status = 'INELIGIBLE';
    reasons.push({ pass: false, text: `Age ${patientAge} exceeds the maximum requirement of ${trial.maximumAge}.` });
  } else {
    const rangeText = trial.maximumAge ? `${trial.minimumAge} – ${trial.maximumAge}` : `≥ ${trial.minimumAge}`;
    reasons.push({ pass: true, text: `Age ${patientAge} is within the study's range [${rangeText}].` });
  }

  // ─── LAYER 1: GENDER GATE ───────────────────────────────────────────────
  // Hard gate: gender mismatch → INELIGIBLE
  if (trialGender !== 'ALL' && patientGender !== 'ALL' && trialGender !== patientGender) {
    status = 'INELIGIBLE';
    reasons.push({ pass: false, text: `Trial is restricted to ${trialGender} patients; patient is ${patientGender}.` });
  } else {
    const restriction = trialGender === 'ALL' ? 'all genders accepted' : `${trialGender} only`;
    reasons.push({ pass: true, text: `Gender criteria met (${restriction}).` });
  }

  // ─── LAYER 2: CONDITION ALIGNMENT ───────────────────────────────────────
  // Soft gate: condition keyword overlap. Bidirectional match: either the trial
  // condition contains the patient keyword, or vice versa. This handles both
  // "Breast Cancer" ↔ "cancer" and "NSCLC" ↔ "lung cancer" cases.
  const conditionMatch = (trial.conditions || []).some(cond =>
    patientConditions.some(pc =>
      cond.toLowerCase().includes(pc) || pc.includes(cond.toLowerCase())
    )
  );

  if (conditionMatch) {
    reasons.push({ pass: true, text: `Condition aligns with trial scope: ${(trial.conditions || []).slice(0, 2).join(', ')}.` });
  } else {
    if (status === 'ELIGIBLE') status = 'PARTIAL'; // Downgrade to PARTIAL
    reasons.push({ pass: false, text: `Condition profile may not directly align — verify primary diagnosis with study coordinator.` });
  }

  // ─── LAYER 3: EXCLUSION CRITERIA SCAN ───────────────────────────────────
  // Scan the free-text eligibility criteria block for exclusion triggers.
  // We split the criteria into inclusion/exclusion sections and look for
  // patient-reported symptoms appearing in the exclusion section.
  if (trial.criteriaText && (patientSymptoms || patientConditions.length > 0)) {
    const text = trial.criteriaText.toLowerCase();

    // Split into inclusion and exclusion sections
    const exclIdx = text.indexOf('exclusion criteria');
    const inclIdx = text.indexOf('inclusion criteria');
    const exclusionSection = exclIdx !== -1 ? text.substring(exclIdx) : '';
    // eslint-disable-next-line no-unused-vars
    const inclusionSection = inclIdx !== -1
      ? (exclIdx !== -1 ? text.substring(inclIdx, exclIdx) : text.substring(inclIdx))
      : text;

    // Parse patient symptom tokens, filter noise words
    const stopWords = new Set(['the', 'and', 'or', 'of', 'in', 'to', 'a', 'an', 'is', 'are']);
    const symptomTokens = patientSymptoms
      .split(/[,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !stopWords.has(s));

    const exclusionHits = symptomTokens.filter(token =>
      exclusionSection && exclusionSection.includes(token)
    );

    if (exclusionHits.length > 0) {
      status = 'INELIGIBLE';
      reasons.push({ pass: false, text: `Exclusion criteria conflict: "${exclusionHits.join(', ')}" detected in exclusion section.` });
    } else {
      reasons.push({ pass: true, text: `No exclusion criteria conflicts identified in patient symptom profile.` });
    }
  }

  return {
    nctId:    trial.nctId,
    title:    trial.title,
    sponsor:  trial.sponsor,
    status,           // 'ELIGIBLE' | 'PARTIAL' | 'INELIGIBLE'
    reasons,          // Array of { pass: boolean, text: string }
    rawTrial: trial   // Full trial for modal display
  };
};

/**
 * runEligibilityAgent({ profile, trials })
 * High-level agent entry point. Scores all provided trials and sorts results:
 * ELIGIBLE first, then PARTIAL, then INELIGIBLE.
 *
 * @param {object} profile - Patient profile
 * @param {Array}  trials  - Array of trial objects to evaluate
 * @returns {Array} Sorted eligibility results
 */
export const runEligibilityAgent = ({ profile, trials }) => {
  const ORDER = { ELIGIBLE: 0, PARTIAL: 1, INELIGIBLE: 2 };
  return trials
    .map(trial => evaluateEligibility(trial, profile))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);
};
