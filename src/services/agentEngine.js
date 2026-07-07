import { fetchClinicalTrials, fetchOpenFDADrug, fetchCompanyMetrics } from './apiService';

// Helper: Parse age strings like "18 Years", "6 Months" to numeric years
export const parseAgeToYears = (ageStr) => {
  if (!ageStr) return 0;
  const cleaned = ageStr.toLowerCase().trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  
  if (cleaned.includes('month')) {
    return num / 12;
  }
  if (cleaned.includes('week')) {
    return num / 52;
  }
  if (cleaned.includes('day')) {
    return num / 365;
  }
  return num; // Default to years
};

// Evaluate patient eligibility against a single trial
export const evaluateEligibility = (trial, profile) => {
  const patientAge = parseFloat(profile.age) || 0;
  const patientGender = (profile.gender || 'ALL').toUpperCase();
  const patientConditions = (profile.conditions || []).map(c => c.toLowerCase().trim());
  const patientSymptoms = (profile.symptoms || '').toLowerCase();
  
  const minYears = parseAgeToYears(trial.minimumAge);
  const maxYears = parseAgeToYears(trial.maximumAge);
  const trialGender = (trial.sex || 'ALL').toUpperCase();
  
  const reasons = [];
  let status = 'ELIGIBLE'; // ELIGIBLE, PARTIAL, INELIGIBLE

  // 1. Age Check
  if (patientAge < minYears) {
    status = 'INELIGIBLE';
    reasons.push(`Age ${patientAge} is below the study's minimum requirement of ${trial.minimumAge}.`);
  } else if (patientAge > maxYears) {
    status = 'INELIGIBLE';
    reasons.push(`Age ${patientAge} is above the study's maximum requirement of ${trial.maximumAge}.`);
  } else {
    reasons.push(`Age ${patientAge} meets criteria [${trial.minimumAge} - ${trial.maximumAge}].`);
  }

  // 2. Gender Check
  if (trialGender !== 'ALL' && patientGender !== 'ALL' && trialGender !== patientGender) {
    status = 'INELIGIBLE';
    reasons.push(`Trial is restricted to ${trialGender} patients, patient is ${patientGender}.`);
  } else {
    reasons.push(`Gender matches trial restriction (${trial.sex}).`);
  }

  // 3. Condition Match
  const conditionMatch = trial.conditions.some(cond => 
    patientConditions.some(pc => cond.toLowerCase().includes(pc) || pc.includes(cond.toLowerCase()))
  );
  
  if (conditionMatch) {
    reasons.push(`Condition profile matches trial scope: ${trial.conditions.join(', ')}.`);
  } else {
    if (status !== 'INELIGIBLE') status = 'PARTIAL';
    reasons.push(`Condition matches are indirect; check if primary diagnosis aligns.`);
  }

  // 4. Text Criteria Scan (Inclusion / Exclusion)
  if (trial.criteriaText && (patientSymptoms || patientConditions.length > 0)) {
    const text = trial.criteriaText.toLowerCase();
    
    // Simple block splitter
    let inclusionPart = '';
    let exclusionPart = '';
    const exclIndex = text.indexOf('exclusion criteria');
    const inclIndex = text.indexOf('inclusion criteria');
    
    if (exclIndex !== -1) {
      exclusionPart = text.substring(exclIndex);
      inclusionPart = inclIndex !== -1 ? text.substring(inclIndex, exclIndex) : text.substring(0, exclIndex);
    } else {
      inclusionPart = text;
    }
    
    // Check for exclusion trigger words (autoimmune, cancer stage, specific medications, etc.)
    const exclWords = patientSymptoms.split(',').map(s => s.trim()).filter(Boolean);
    const exclusionHits = [];
    
    exclWords.forEach(word => {
      if (exclusionPart && exclusionPart.includes(word)) {
        exclusionHits.push(word);
      }
    });

    if (exclusionHits.length > 0) {
      status = 'INELIGIBLE';
      reasons.push(`Exclusion Criteria Conflict: Patient profile notes "${exclusionHits.join(', ')}" which matches trial exclusion specifications.`);
    } else {
      reasons.push(`No explicit exclusions triggered based on symptoms profile.`);
    }
  }

  return {
    nctId: trial.nctId,
    title: trial.title,
    sponsor: trial.sponsor,
    status,
    reasons,
    rawTrial: trial
  };
};

// NLP Agent parsing and reasoning engine
export const runAgentQuery = async (queryText) => {
  const query = queryText.toLowerCase().trim();
  const steps = [];
  
  steps.push({ time: new Date().toLocaleTimeString(), text: "🔍 Analyzing natural language query..." });
  
  // 1. Determine Intent
  let intent = 'trial_search';
  let extractedFilters = {};
  
  // Compare drugs intent
  if (query.includes('compare') || (query.includes('and') && (query.includes('side effect') || query.includes('drug') || query.includes('vs')))) {
    intent = 'drug_compare';
  }
  // OpenFDA search intent
  else if (query.includes('drug') || query.includes('fda') || query.includes('side effect') || query.includes('ingredient') || query.includes('brand name')) {
    intent = 'drug_search';
  }
  // Company metrics intent
  else if (query.includes('pipeline') || query.includes('metrics') || query.includes('portfolio') || query.includes('timeline') || query.includes('company wise')) {
    intent = 'company_insights';
  }
  // Eligibility check intent
  else if (query.includes('eligible') || query.includes('eligibility') || query.includes('am i') || query.includes('enrol')) {
    intent = 'eligibility_check';
  }
  
  steps.push({ time: new Date().toLocaleTimeString(), text: `🎯 Identified intent: ${intent.toUpperCase().replace('_', ' ')}` });

  // 2. Parse details based on intent
  if (intent === 'trial_search') {
    steps.push({ time: new Date().toLocaleTimeString(), text: "🛠️ Extracting search filters (condition, sponsor, phase)..." });
    
    // Extract sponsor
    const sponsors = ['pfizer', 'novartis', 'roche', 'merck', 'moderna', 'astrazeneca', 'eli lilly', 'eisai'];
    sponsors.forEach(s => {
      if (query.includes(s)) extractedFilters.sponsor = s;
    });
    
    // Extract phase
    if (query.includes('phase 1') || query.includes('phase i ')) extractedFilters.phase = 'PHASE1';
    else if (query.includes('phase 2') || query.includes('phase ii')) extractedFilters.phase = 'PHASE2';
    else if (query.includes('phase 3') || query.includes('phase iii')) extractedFilters.phase = 'PHASE3';
    else if (query.includes('phase 4') || query.includes('phase iv')) extractedFilters.phase = 'PHASE4';

    // Extract status
    if (query.includes('completed')) extractedFilters.status = 'COMPLETED';
    else if (query.includes('recruiting') || query.includes('active')) extractedFilters.status = 'RECRUITING';
    
    // Extract condition keyword (rest of query)
    let condition = query;
    // Strip utility words
    const stripWords = ['find', 'search', 'trial', 'trials', 'active', 'completed', 'by', 'for', 'phase 1', 'phase 2', 'phase 3', 'phase 4', 'recruiting', ...sponsors];
    stripWords.forEach(w => {
      condition = condition.replace(new RegExp(`\\b${w}\\b`, 'g'), '');
    });
    condition = condition.replace(/\s+/g, ' ').trim();
    if (condition) extractedFilters.keyword = condition;

    steps.push({ 
      time: new Date().toLocaleTimeString(), 
      text: `📡 Requesting ClinicalTrials.gov V2 API with parameters: ${JSON.stringify(extractedFilters)}` 
    });
    
    const results = await fetchClinicalTrials(extractedFilters);
    steps.push({ time: new Date().toLocaleTimeString(), text: `✅ Fetched ${results.length} trials matching criteria.` });
    
    return {
      intent,
      steps,
      filters: extractedFilters,
      data: results
    };
  }
  
  if (intent === 'drug_search') {
    // Extract drug query
    let drugQuery = query.replace('drug', '').replace('search', '').replace('fda', '').replace('side effects', '').replace('side effect', '').replace('ingredients', '').replace('brand name', '').trim();
    if (drugQuery.includes('for ')) {
      drugQuery = drugQuery.split('for ')[1] || drugQuery;
    }
    steps.push({ time: new Date().toLocaleTimeString(), text: `📡 Connecting to OpenFDA API for query: "${drugQuery}"...` });
    
    const results = await fetchOpenFDADrug(drugQuery);
    steps.push({ time: new Date().toLocaleTimeString(), text: `✅ OpenFDA search returned ${results.length} records.` });
    
    return {
      intent,
      steps,
      searchQuery: drugQuery,
      data: results
    };
  }
  
  if (intent === 'drug_compare') {
    // Extract drug names
    let words = query.replace('compare', '').replace('vs', ' ').replace('and', ' ').split(/\s+/).filter(w => w.length > 2 && w !== 'side' && w !== 'effects');
    const drug1 = words[0] || 'advil';
    const drug2 = words[1] || 'tylenol';
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `📡 Pulling label information for ${drug1.toUpperCase()}...` });
    const res1 = await fetchOpenFDADrug(drug1);
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `📡 Pulling label information for ${drug2.toUpperCase()}...` });
    const res2 = await fetchOpenFDADrug(drug2);
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `✅ Loaded drug profiles. Structuring side-by-side comparison...` });
    
    return {
      intent,
      steps,
      data: {
        drug1: res1[0] || { brandName: drug1, notFound: true },
        drug2: res2[0] || { brandName: drug2, notFound: true }
      }
    };
  }

  if (intent === 'company_insights') {
    // Extract company
    const companies = ['pfizer', 'novartis', 'roche', 'merck', 'moderna', 'astrazeneca'];
    let selectedCompany = 'Pfizer';
    companies.forEach(c => {
      if (query.includes(c)) {
        selectedCompany = c.charAt(0).toUpperCase() + c.slice(1);
      }
    });
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `📊 Fetching pipeline summaries & trial growth charts for: ${selectedCompany}...` });
    const metrics = fetchCompanyMetrics(selectedCompany);
    steps.push({ time: new Date().toLocaleTimeString(), text: `✅ Structured company-wise dashboard datasets for ${selectedCompany}.` });
    
    return {
      intent,
      steps,
      company: selectedCompany,
      data: metrics
    };
  }

  if (intent === 'eligibility_check') {
    steps.push({ time: new Date().toLocaleTimeString(), text: "⚙️ Extracting patient profiles from prompt text..." });
    
    // Extract age
    const ageMatch = query.match(/(\d+)\s*(year|yr|yo|age)/);
    const age = ageMatch ? parseInt(ageMatch[1]) : 45; // default 45
    
    // Extract gender
    let gender = 'ALL';
    if (query.includes('female') || query.includes('woman') || query.includes('lady')) gender = 'FEMALE';
    else if (query.includes('male') || query.includes('man') || query.includes('guy')) gender = 'MALE';
    
    // Extract condition
    let condition = '';
    const condKeywords = ['cancer', 'covid', 'diabetes', 'heart', 'alzheimer', 'lung', 'kidney', 'kidney disease', 'obesity', 'respiratory'];
    condKeywords.forEach(k => {
      if (query.includes(k)) condition = k;
    });
    if (!condition) condition = 'cancer'; // default oncology
    
    const profile = { age, gender, conditions: [condition], symptoms: '' };
    steps.push({ 
      time: new Date().toLocaleTimeString(), 
      text: `👤 Profile compiled: Age: ${age}, Gender: ${gender}, Core Condition: "${condition}"` 
    });
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `📡 Querying ClinicalTrials.gov for "${condition}" trials...` });
    const trials = await fetchClinicalTrials({ keyword: condition });
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `🧠 Processing criteria matrices for top ${Math.min(3, trials.length)} active trials...` });
    const evaluations = trials.slice(0, 3).map(trial => evaluateEligibility(trial, profile));
    
    steps.push({ time: new Date().toLocaleTimeString(), text: `✅ Eligibility parsing completed.` });
    
    return {
      intent,
      steps,
      profile,
      data: evaluations
    };
  }
  
  // Fallback
  return {
    intent: 'unknown',
    steps: [...steps, { time: new Date().toLocaleTimeString(), text: "⚠️ Unrecognized intent. Please try another clinical question!" }],
    data: null
  };
};
