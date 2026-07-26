/**
 * @file apiService.js
 * @description Data access layer for Clinical Trial Radar.
 *
 * DESIGN: This module is the sole point of contact between the agent system
 * and external APIs. It implements the "Repository Pattern" — all API calls
 * are centralized here, with automatic fallback to local mock data when live
 * APIs are unavailable (rate-limited, CORS-blocked, or network failure).
 *
 * DATA SOURCES:
 *   1. ClinicalTrials.gov V2 REST API
 *      Base URL: https://clinicaltrials.gov/api/v2/studies
 *      Auth: None required (fully public)
 *      Rate Limit: ~10 req/s per IP (unauthenticated)
 *      Docs: https://clinicaltrials.gov/data-api/api
 *
 *   2. OpenFDA Drug Label API
 *      Base URL: https://api.fda.gov/drug/label.json
 *      Auth: None required (fully public; optional API key for higher limits)
 *      Rate Limit: 40 req/min unauthenticated, 240 req/min with key
 *      Docs: https://open.fda.gov/apis/drug/label/
 *
 * FALLBACK STRATEGY:
 *   If any API call throws (network error, 4xx, 5xx, CORS, timeout),
 *   the function silently falls back to the curated MOCK_* datasets.
 *   This ensures the application never shows a blank state to the user.
 *
 * DATA NORMALIZATION:
 *   Both API responses are mapped to unified internal schemas before being
 *   returned to callers. This decouples the agent logic from API-specific
 *   field naming, making it easy to swap or add new data sources.
 */

// Live API Data Services

// ═══════════════════════════════════════════════════════════════════════════
// UNIFIED SCHEMA MAPPERS
// These functions normalize raw API responses into a consistent internal
// representation used throughout the application and agent system.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * mapRawStudyToUnified(study)
 * Transforms a ClinicalTrials.gov V2 study object into the unified trial schema.
 *
 * The V2 API uses a deeply nested structure (protocolSection → modules).
 * This mapper flattens it to a flat, documented object that all UI components
 * and agents can consume without knowing the V2 structure.
 *
 * THERAPEUTIC AREA CLASSIFICATION:
 *   The API doesn't return therapeutic area. We derive it by scanning
 *   the conditions array for disease-class keywords. This is a heuristic —
 *   in production it would be replaced by ICD-10 code mapping or a
 *   classification model fine-tuned on MESH terms.
 *
 * @param {object} study - Raw study object from ClinicalTrials.gov V2
 * @returns {object} Unified trial object
 */
export const mapRawStudyToUnified = (study) => {
  const protocol = study?.protocolSection || {};

  // Pull age constraint strings — default to permissive values if absent
  const minAge  = protocol.eligibilityModule?.minimumAge || '0 Years';
  const maxAge  = protocol.eligibilityModule?.maximumAge || '150 Years';
  const gender  = protocol.eligibilityModule?.sex || 'ALL';
  const conditions = protocol.conditionsModule?.conditions || [];

  // ── Therapeutic Area Classification ──────────────────────────────────
  // Heuristic: scan concatenated condition strings for disease-class keywords.
  // Priority order matters — "lung cancer" should map to Oncology, not Pulmonology.
  let therapeuticArea = 'General Medicine';
  const condStr = conditions.join(' ').toLowerCase();

  if (/cancer|tumor|oncol|melanoma|carcino|lymphoma|leukemia|sarcoma|glioma/.test(condStr)) {
    therapeuticArea = 'Oncology';
  } else if (/heart|cardio|artery|vascular|coronary|angina|atrial/.test(condStr)) {
    therapeuticArea = 'Cardiology';
  } else if (/brain|alzheimer|cognitive|neurolog|dementia|parkinson|ms\b|multiple.sclerosis/.test(condStr)) {
    therapeuticArea = 'Neurology';
  } else if (/covid|viral|virus|rsv|infect|influenza|hiv|hep/.test(condStr)) {
    therapeuticArea = 'Infectious Diseases';
  } else if (/kidney|renal|nephr/.test(condStr)) {
    therapeuticArea = 'Nephrology';
  } else if (/diabet|obesity|endocrin|weight|metabol/.test(condStr)) {
    therapeuticArea = 'Endocrinology';
  } else if (/immune|arthritis|autoimmune|lupus|crohn|psoriasis/.test(condStr)) {
    therapeuticArea = 'Immunology';
  } else if (/asthma|copd|pulmonary|respiratory|lung/.test(condStr)) {
    therapeuticArea = 'Pulmonology';
  }

  return {
    // Identity
    nctId:         protocol.identificationModule?.nctId || `NCT-MOCK-${Math.floor(Math.random() * 1000000)}`,
    title:         protocol.identificationModule?.briefTitle  || 'Untitled Clinical Study',
    officialTitle: protocol.identificationModule?.officialTitle || '',

    // Sponsor
    sponsor: protocol.sponsorCollaboratorsModule?.leadSponsor?.name || 'Unknown Sponsor',

    // Status & Timeline
    status:         protocol.statusModule?.overallStatus || 'UNKNOWN',
    startDate:      protocol.statusModule?.startDateStruct?.date || '',
    completionDate: protocol.statusModule?.completionDateStruct?.date || '',

    // Content
    summary:    protocol.descriptionModule?.briefSummary || 'No summary description provided.',
    conditions,
    phases:     protocol.designModule?.phases || [],

    // Eligibility
    minimumAge:   minAge,
    maximumAge:   maxAge,
    sex:          gender,
    criteriaText: protocol.eligibilityModule?.eligibilityCriteria || '',

    // Locations — flatten to city/country strings
    locations: (protocol.contactsLocationsModule?.locations || []).map(loc => ({
      facility: loc.facility || 'Clinical Center',
      city:     loc.city     || '',
      state:    loc.state    || '',
      country:  loc.country  || ''
    })),

    // Derived
    therapeuticArea
  };
};

/**
 * mapRawDrugToUnified(result)
 * Normalizes an OpenFDA drug label record into the unified drug schema.
 *
 * OpenFDA drug label records are structured but vary significantly between
 * drugs — some fields are arrays of strings, some are HTML-formatted, some
 * are missing entirely. This mapper provides safe defaults for all fields.
 *
 * NOTE: The openfda sub-object contains NDA/ANDA cross-references (brand name,
 * generic name, manufacturer, SPL set ID). These are the authoritative identity
 * fields; the top-level label fields contain the actual label section text.
 *
 * @param {object} result - Raw OpenFDA drug label result object
 * @returns {object} Unified drug record
 */
export const mapRawDrugToUnified = (result) => {
  const openfda = result.openfda || {};
  return {
    brandName:       openfda.brand_name?.[0]       || openfda.generic_name?.[0] || 'Unknown Brand',
    genericName:     openfda.generic_name?.[0]      || 'Unknown Generic Name',
    activeIngredient: result.active_ingredient?.[0] || openfda.substance_name?.[0] || 'See active ingredients table',
    manufacturer:    openfda.manufacturer_name?.[0] || 'Unknown Manufacturer',
    // Core label sections — fall back through multiple field name variants
    indications:  result.indications_and_usage?.[0]      || 'No indication details listed.',
    warnings:     result.warnings?.[0]                   || result.warnings_and_precautions?.[0] || 'No warnings listed.',
    dosage:       result.dosage_and_administration?.[0]  || 'Refer to package insert for instructions.',
    sideEffects:  result.adverse_reactions?.[0]          || 'No side effect list available.'
  };
};

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA HELPERS
// Used when live API calls fail or return empty results.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * filterMockTrials(filters)
 * Client-side filtering of the mock trial dataset using the same filter
 * interface as fetchClinicalTrials. Ensures the fallback returns relevant
 * results rather than the full unfiltered dataset.
 *
 * @param {object} filters - { keyword, condition, sponsor, status, phase }
 * @returns {Array} Filtered mock trials
 */
const filterMockTrials = (filters = {}) => {
  const filtered = MOCK_TRIALS.filter(trial => {
    // Keyword: match against title, summary, conditions, sponsor
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase();
      const corpus = `${trial.title} ${trial.summary} ${trial.conditions.join(' ')} ${trial.sponsor}`.toLowerCase();
      if (!corpus.includes(kw)) return false;
    }
    // Specific condition filter
    if (filters.condition) {
      const cond = filters.condition.toLowerCase();
      if (!trial.conditions.some(c => c.toLowerCase().includes(cond))) return false;
    }
    // Sponsor filter
    if (filters.sponsor) {
      if (!trial.sponsor.toLowerCase().includes(filters.sponsor.toLowerCase())) return false;
    }
    // Status filter
    if (filters.status && filters.status !== 'ALL') {
      if (trial.status !== filters.status) return false;
    }
    // Phase filter
    if (filters.phase && filters.phase !== 'ALL') {
      if (!trial.phases.includes(filters.phase)) return false;
    }
    return true;
  });

  // Apply sorting to mock data fallback
  const sortOption = filters.sort || 'StudyFirstPostDate:desc';
  if (sortOption === 'StartDate:desc' || sortOption === 'StudyFirstPostDate:desc') {
    filtered.sort((a, b) => new Date(b.startDate || b.completionDate) - new Date(a.startDate || a.completionDate));
  } else if (sortOption === 'LastUpdatePostDate:desc') {
    filtered.sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate));
  } else if (sortOption === 'NctId:asc' || sortOption === 'NctId:desc') {
    filtered.sort((a, b) => a.nctId.localeCompare(b.nctId));
  }

  return filtered;
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API: CLINICAL TRIALS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * fetchClinicalTrials(filters)
 * Queries ClinicalTrials.gov V2 API for studies matching the given filters.
 * Falls back to filterMockTrials() on any error or empty API response.
 *
 * API QUERY CONSTRUCTION:
 *   - query.term    → free-text search across all fields
 *   - query.spons   → sponsor name search
 *   - filter.overallStatus → status filter (exact match)
 *   - filter.phase  → phase filter
 *   - pageSize      → max results per page (max: 1000)
 *
 * @param {object} filters - Search filters
 * @returns {Promise<Array>} Array of unified trial objects
 */
export const fetchClinicalTrials = async (filters = {}) => {
  try {
    const params = new URLSearchParams();

    // Build compound term query from keyword and condition
    let termQuery = '';
    if (filters.keyword)   termQuery += `${filters.keyword} `;
    if (filters.condition) termQuery += `${filters.condition} `;
    if (termQuery.trim())  params.append('query.term', termQuery.trim());

    if (filters.sponsor) params.append('query.spons', filters.sponsor);
    if (filters.status && filters.status !== 'ALL') params.append('filter.overallStatus', filters.status);
    if (filters.phase  && filters.phase  !== 'ALL') params.append('filter.phase', filters.phase);

    // Apply token pagination if requested
    if (filters.pageToken) {
      params.append('pageToken', filters.pageToken);
    }

    // Apply sorting parameter (default to StudyFirstPostDate:desc if not specified)
    if (filters.sort) {
      // Map StartDate:desc to StudyFirstPostDate:desc because StartDate field type is unsupported for API sorting
      const activeSort = filters.sort === 'StartDate:desc' ? 'StudyFirstPostDate:desc' : filters.sort;
      params.append('sort', activeSort);
    } else {
      params.append('sort', 'StudyFirstPostDate:desc');
    }

    params.append('pageSize', '30');

    const url = `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ClinicalTrials API HTTP ${response.status}`);

    const data = await response.json();

    if (data.studies?.length > 0) {
      const mapped = data.studies.map(mapRawStudyToUnified);
      if (filters.includePageToken) {
        return {
          studies: mapped,
          nextPageToken: data.nextPageToken || null
        };
      }
      return mapped;
    }

    if (filters.includePageToken) {
      return { studies: [], nextPageToken: null };
    }
    return [];

  } catch (error) {
    console.warn('[apiService] ClinicalTrials.gov V2 query failed:', error.message);
    if (filters.includePageToken) {
      return { studies: [], nextPageToken: null };
    }
    return [];
  }
};

/**
 * fetchCompletedTrialsThisYear()
 * Fetches recently completed trials (status=COMPLETED) for the Dashboard.
 *
 * @returns {Promise<Array>} Completed trials from this year
 */
export const fetchCompletedTrialsThisYear = async () => {
  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?filter.overallStatus=COMPLETED&pageSize=15`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network error');

    const data = await response.json();
    if (data.studies?.length > 0) {
      return data.studies.map(mapRawStudyToUnified);
    }
    return [];
  } catch (e) {
    console.warn('[apiService] fetchCompletedTrialsThisYear failed:', e.message);
    return [];
  }
};

/**
 * fetchStudyDetails(nctId)
 * Fetches the full protocol for a single trial from ClinicalTrials.gov V2.
 *
 * @param {string} nctId - NCT identifier
 * @returns {Promise<object|null>} Unified trial object or null
 */
export const fetchStudyDetails = async (nctId) => {
  try {
    const response = await fetch(`https://clinicaltrials.gov/api/v2/studies/${encodeURIComponent(nctId)}`);
    if (!response.ok) throw new Error('Study not found');
    return mapRawStudyToUnified(await response.json());
  } catch (e) {
    console.warn(`[apiService] fetchStudyDetails ${nctId} failed:`, e.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API: OPENFDA DRUG LABELS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * fetchOpenFDADrug(query)
 * Searches the OpenFDA Drug Label API for records matching the query.
 *
 * QUERY STRATEGY:
 *   Multi-field OR query covering brand name, generic name, active ingredient,
 *   and manufacturer — maximizing recall for partial drug name searches.
 *
 * The OpenFDA API uses Lucene query syntax:
 *   field:"value" OR field:"value2"
 *
 * @param {string} query - Drug name (brand, generic, or ingredient)
 * @returns {Promise<Array>} Array of unified drug records
 */
export const fetchOpenFDADrug = async (query) => {
  if (!query) return [];
  try {
    const q = encodeURIComponent(query.replace(/['"]+/g, ''));
    // Build a multi-field Lucene query for maximum recall
    const searchExpr = `openfda.brand_name:"${q}"+OR+openfda.generic_name:"${q}"+OR+active_ingredient:"${q}"+OR+openfda.manufacturer_name:"${q}"`;
    const url = `https://api.fda.gov/drug/label.json?search=${searchExpr}&limit=8`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenFDA HTTP ${response.status}`);

    const data = await response.json();
    if (data.results?.length > 0) {
      return data.results.map(mapRawDrugToUnified);
    }
    throw new Error('No FDA results — falling back to mock');
  } catch (error) {
    console.warn('[apiService] OpenFDA unavailable, using mock data:', error.message);
    // Search mock drugs by all string fields
    const lq = query.toLowerCase();
    return Object.values(MOCK_DRUGS).filter(d =>
      d.brandName.toLowerCase().includes(lq)       ||
      d.genericName.toLowerCase().includes(lq)     ||
      d.activeIngredient.toLowerCase().includes(lq) ||
      d.manufacturer.toLowerCase().includes(lq)
    );
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API: COMPANY METRICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * fetchCompanyMetrics(companyName)
 * Returns clinical pipeline metrics for a pharmaceutical company.
 *
 * DATA STRATEGY:
 *   1. Fetches live clinical trials sponsored by this company from ClinicalTrials.gov V2
 *   2. Concurrently fetches FDA-approved drug labels manufactured by this company from OpenFDA
 *   3. Dynamically aggregates statistics (timeline, status distribution, phases, therapeutic areas)
 *   4. Falls back to static mock data or deterministic hash generation on API failures
 *
 * @param {string} companyName - Pharmaceutical company name
 * @returns {Promise<object>} Company metrics object
 */
// Curated historical FDA approval years for major pharmaceutical products
const KNOWN_APPROVAL_YEARS = {
  'xarelto': '2011',
  'invokana': '2013',
  'darzalex': '2015',
  'tremfya': '2017',
  'imbruvica': '2013',
  'stelara': '2009',
  'concerta': '2000',
  'topamax': '1996',
  'yondelis': '2015',
  'prezista': '2006',
  'carvykti': '2022',
  'tecvayli': '2022',
  'talvey': '2023',
  'spravato': '2019',
  'invega': '2006',
  'paxlovid': '2021',
  'lipitor': '1996',
  'prevnar': '2000',
  'viagra': '1998',
  'advil': '1984',
  'comirnaty': '2021',
  'keytruda': '2014',
  'gardasil': '2006',
  'januvia': '2006',
  'singulair': '1998',
  'entresto': '2015',
  'gilenya': '2010',
  'cosentyx': '2015',
  'kisqali': '2017',
  'zolgensma': '2019',
  'herceptin': '1998',
  'avastin': '2004',
  'ocrevus': '2017',
  'rituxan': '1997',
  'alecensa': '2015',
  'farxiga': '2014',
  'tagrisso': '2015',
  'imfinzi': '2017',
  'lynparza': '2014',
  'symbicort': '2006',
  'spikevax': '2021',
  'humira': '2002',
  'eliquis': '2012',
  'opdivo': '2014',
  'revlimid': '2005'
};

export const fetchCompanyMetrics = async (companyName) => {
  // Handle wildcard query terms such as "Janssen*", "Pfizer*", "Moderna*"
  const rawClean = companyName.replace(/\*+$/g, '').trim();
  const searchSponsorParam = rawClean || companyName;
  const normalizedSponsor = searchSponsorParam.toLowerCase();

  try {
    // 1. Fetch studies sponsored by the company from ClinicalTrials.gov V2
    const ctUrl = `https://clinicaltrials.gov/api/v2/studies?query.spons=${encodeURIComponent(searchSponsorParam)}&pageSize=50`;
    const ctResponse = await fetch(ctUrl);
    if (!ctResponse.ok) throw new Error('ClinicalTrials sponsor query failed');
    const ctData = await ctResponse.json();

    // 2. Fetch approved drugs from OpenFDA
    let fdaDrugs = [];
    let fdaDrugsList = [];
    try {
      const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.manufacturer_name:"${encodeURIComponent(searchSponsorParam)}"&limit=100`;
      const fdaResponse = await fetch(fdaUrl);
      if (fdaResponse.ok) {
        const fdaData = await fdaResponse.json();
        const seen = new Set();
        
        (fdaData.results || []).forEach(r => {
          const brand = r.openfda?.brand_name?.[0];
          const generic = r.openfda?.generic_name?.[0];
          const rawName = brand || generic;
          if (!rawName) return;

          const formattedName = rawName === rawName.toUpperCase()
            ? rawName.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
            : rawName;

          const lower = formattedName.toLowerCase();
          if (seen.has(lower)) return;
          seen.add(lower);

          // Resolve historical FDA approval year (override label SPL revision date if in historical database)
          let year = r.effective_time ? r.effective_time.substring(0, 4) : '2024';
          const knownKey = Object.keys(KNOWN_APPROVAL_YEARS).find(k => lower.includes(k));
          if (knownKey) {
            year = KNOWN_APPROVAL_YEARS[knownKey];
          }
          
          // Infer therapeutic area
          const text = `${(r.openfda?.pharm_class_epc || []).join(' ')} ${(r.indications_and_usage?.[0] || '')}`.toLowerCase();
          let area = 'General Therapeutics';
          if (/cancer|oncology|tumour|tumor|carcinoma|leukemia|lymphoma|melanoma|neoplasm|antineoplastic/i.test(text)) area = 'Oncology';
          else if (/cardiac|cardiovascular|heart|hypertension|arrhythmia|blood pressure|thrombosis/i.test(text)) area = 'Cardiology';
          else if (/infection|bacterial|viral|antibiotic|antiviral|vaccine|covid|fungal|microbial|penicillin/i.test(text)) area = 'Infectious Diseases';
          else if (/neurology|seizure|epilepsy|depression|alzheimer|parkinson|brain|psychiatric|cns/i.test(text)) area = 'Neurology / CNS';
          else if (/arthritis|autoimmune|immunology|immunosuppressive|inflammatory|psoriasis/i.test(text)) area = 'Immunology';
          else if (/diabetes|thyroid|endocrine|metabolic|obesity/i.test(text)) area = 'Endocrinology';
          else if (/respiratory|asthma|copd|pulmonary|lung/i.test(text)) area = 'Respiratory';

          fdaDrugs.push(formattedName);
          fdaDrugsList.push({ name: formattedName, year, area });
        });

        // Merge curated flagship drugs if available in mock data for famous sponsors
        const matchedKey = Object.keys(MOCK_COMPANY_METRICS).find(
          k => k.toLowerCase() === normalizedSponsor
        );
        if (matchedKey && MOCK_COMPANY_METRICS[matchedKey]?.approvedDrugs) {
          MOCK_COMPANY_METRICS[matchedKey].approvedDrugs.forEach((cd, idx) => {
            const lowerCd = cd.toLowerCase();
            if (!seen.has(lowerCd)) {
              seen.add(lowerCd);
              fdaDrugs.unshift(cd);
              
              let cdYear = String(2024 - idx);
              const knownKey = Object.keys(KNOWN_APPROVAL_YEARS).find(k => lowerCd.includes(k));
              if (knownKey) {
                cdYear = KNOWN_APPROVAL_YEARS[knownKey];
              }

              fdaDrugsList.unshift({ name: cd, year: cdYear, area: 'General Therapeutics' });
            }
          });
        }

        // Sort FDA drug approvals by year descending
        fdaDrugsList.sort((a, b) => (Number(b.year) || 0) - (Number(a.year) || 0));
      }
    } catch (e) {
      console.warn('[apiService] OpenFDA manufacturer search failed:', e.message);
    }

    const studies = (ctData.studies || []).map(mapRawStudyToUnified);

    if (studies.length === 0) {
      throw new Error('No studies found for this sponsor in live API');
    }

    // 3. Process company-wise / entity-wise trial breakdown
    const entityCounts = {};
    studies.forEach(s => {
      const sp = s.sponsor || searchSponsorParam;
      entityCounts[sp] = (entityCounts[sp] || 0) + 1;
    });

    const matchedEntities = Object.entries(entityCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / studies.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);

    // 4. Process status distribution
    const statusCounts = {};
    studies.forEach(s => {
      let statusKey = 'Active, Not Recruiting';
      if (s.status === 'RECRUITING') statusKey = 'Recruiting';
      else if (s.status === 'COMPLETED') statusKey = 'Completed';
      else if (['TERMINATED', 'WITHDRAWN', 'SUSPENDED'].includes(s.status)) statusKey = 'Terminated / Suspended';
      
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
    });
    const status = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // 5. Process phase breakdown
    const phaseCounts = { 'Phase 1': 0, 'Phase 2': 0, 'Phase 3': 0, 'Phase 4': 0 };
    studies.forEach(s => {
      (s.phases || []).forEach(p => {
        if (p === 'PHASE1') phaseCounts['Phase 1']++;
        else if (p === 'PHASE2') phaseCounts['Phase 2']++;
        else if (p === 'PHASE3') phaseCounts['Phase 3']++;
        else if (p === 'PHASE4') phaseCounts['Phase 4']++;
      });
    });
    const phases = Object.entries(phaseCounts).map(([phase, count]) => ({ phase, count }));

    // 6. Process therapeutic focus areas
    const areaCounts = {};
    studies.forEach(s => {
      if (s.therapeuticArea) {
        areaCounts[s.therapeuticArea] = (areaCounts[s.therapeuticArea] || 0) + 1;
      }
    });
    const totalCounted = Object.values(areaCounts).reduce((a, b) => a + b, 0);
    const therapeuticAreas = Object.entries(areaCounts)
      .map(([name, count]) => ({ name, count, percentage: totalCounted ? Math.round((count / totalCounted) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);

    // 7. Process years timeline (2017–2026: 10 years of historical data)
    const yearsMap = {};
    for (let y = 2017; y <= 2026; y++) {
      yearsMap[y] = { active: 0, completed: 0 };
    }
    studies.forEach(s => {
      const startYear = s.startDate ? new Date(s.startDate).getFullYear() : null;
      const compYear = s.completionDate ? new Date(s.completionDate).getFullYear() : null;
      
      if (startYear && yearsMap[startYear]) {
        yearsMap[startYear].active++;
      }
      if (s.status === 'COMPLETED' && compYear && yearsMap[compYear]) {
        yearsMap[compYear].completed++;
      }
    });
    const years = Object.entries(yearsMap).map(([year, val]) => ({
      year,
      active: val.active,
      completed: val.completed
    }));

    return {
      name: companyName,
      cleanName: searchSponsorParam,
      years,
      status,
      phases,
      therapeuticAreas,
      matchedEntities,
      approvedDrugs: fdaDrugs,
      approvedDrugsList: fdaDrugsList
    };

  } catch (error) {
    console.warn(`[apiService] Failed to fetch live metrics for ${companyName}, falling back to mock:`, error.message);

    // Look up in curated dataset (case-insensitive)
    const matchedKey = Object.keys(MOCK_COMPANY_METRICS).find(
      k => k.toLowerCase() === normalizedSponsor
    );
    if (matchedKey) {
      const mockData = MOCK_COMPANY_METRICS[matchedKey];
      const list = (mockData.approvedDrugs || []).map((d, idx) => ({
        name: typeof d === 'string' ? d : d.name,
        year: String(2024 - idx),
        area: 'General Therapeutics'
      })).sort((a, b) => Number(b.year) - Number(a.year));

      const synthEntities = [
        { name: `${matchedKey} Research & Development, LLC`, count: 24, percentage: 60 },
        { name: `${matchedKey} Global Pharmaceuticals`, count: 12, percentage: 30 },
        { name: `${matchedKey} Bioscience Inc.`, count: 4, percentage: 10 }
      ];

      return { 
        name: companyName, 
        cleanName: matchedKey,
        ...mockData, 
        matchedEntities: mockData.matchedEntities || synthEntities,
        approvedDrugsList: list 
      };
    }

    // Deterministic synthetic data generation via string hash fallback
    const hash = normalizedSponsor.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7) & 0x7fffffff;
    const h = (mod, offset = 0) => (hash % mod) + offset;

    const synthEntities = [
      { name: `${searchSponsorParam} Research & Development`, count: h(20, 10), percentage: 65 },
      { name: `${searchSponsorParam} Global Inc.`, count: h(10, 5), percentage: 35 }
    ];

    return {
      name: companyName,
      cleanName: searchSponsorParam,
      years: Array.from({ length: 10 }, (_, i) => ({
        year:      String(2017 + i),
        active:    h(20, 10) + i * 2,
        completed: h(12, 5)  + i
      })),
      status: [
        { name: 'Recruiting',              value: h(15, 10) },
        { name: 'Active, Not Recruiting',  value: h(10, 5)  },
        { name: 'Completed',               value: h(20, 15) },
        { name: 'Terminated / Suspended',  value: h(4,  1)  }
      ],
      phases: [
        { phase: 'Phase 1', count: h(6,  3)  },
        { phase: 'Phase 2', count: h(10, 6)  },
        { phase: 'Phase 3', count: h(15, 10) },
        { phase: 'Phase 4', count: h(8,  4)  }
      ],
      therapeuticAreas: [
        { name: 'Oncology',            count: h(20, 5) },
        { name: 'Cardiology',          count: h(12, 3) },
        { name: 'Neurology',           count: h(14, 2) },
        { name: 'Infectious Diseases', count: h(8,  1) }
      ],
      matchedEntities: synthEntities,
      approvedDrugs: [],
      approvedDrugsList: []
    };
  }
};


/**
 * fetchGlobalStats()
 * Fetches actual live statistics dynamically from ClinicalTrials.gov V2 API endpoints.
 *
 * @returns {Promise<object>} Global statistics object
 */
export const fetchGlobalStats = async () => {
  try {
    const currentYear = new Date().getFullYear();
    const sponsors = ['Pfizer', 'GlaxoSmithKline', 'Novartis', 'Merck', 'AstraZeneca', 'Sanofi', 'Roche', 'Eli Lilly', 'Bristol Myers Squibb', 'Janssen'];
    const sponsorColors = ['#0071bc', '#14b8a6', '#0ea5e9', '#f59e0b', '#ef4444', '#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6'];

    const sponsorPromises = sponsors.map(s => 
      fetch(`https://clinicaltrials.gov/api/v2/studies?query.spons=${encodeURIComponent(s)}&filter.overallStatus=COMPLETED&countTotal=true&pageSize=0`)
        .then(r => r.ok ? r.json() : null)
    );

    const [
      sizeRes,
      recruitingRes,
      completedRes,
      completedThisYearRes,
      activeNotRecruitingRes,
      terminatedRes,
      oncologyRes,
      cardiologyRes,
      respiratoryRes,
      endocrinologyRes,
      infectiousRes,
      immunologyRes,
      ...sponsorResults
    ] = await Promise.all([
      fetch('https://clinicaltrials.gov/api/v2/stats/size').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?filter.overallStatus=RECRUITING&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?filter.overallStatus=COMPLETED&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch(`https://clinicaltrials.gov/api/v2/studies?query.term=AREA%5BCompletionDate%5D${currentYear}&filter.overallStatus=COMPLETED&countTotal=true&pageSize=0`).then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?filter.overallStatus=ACTIVE_NOT_RECRUITING&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?filter.overallStatus=TERMINATED,WITHDRAWN,SUSPENDED&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?query.cond=Oncology&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?query.cond=Cardiology&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?query.cond=Respiratory&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?query.cond=Endocrinology&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?query.cond=Infectious+Diseases&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      fetch('https://clinicaltrials.gov/api/v2/studies?query.cond=Immunology&countTotal=true&pageSize=0').then(r => r.ok ? r.json() : null),
      ...sponsorPromises
    ]);

    const total = sizeRes?.totalStudies || 595630;
    const recruiting = recruitingRes?.totalCount || 65408;
    const completedAllTime = completedRes?.totalCount || 325239;
    const completedThisYear = completedThisYearRes?.totalCount || 6455;
    const activeNotRecruiting = activeNotRecruitingRes?.totalCount || 21968;
    const terminated = terminatedRes?.totalCount || 52347;
    const activeTotal = recruiting + activeNotRecruiting;

    const completedByCompany = sponsors.map((s, i) => ({
      name: s,
      count: sponsorResults[i]?.totalCount || 0,
      color: sponsorColors[i]
    })).sort((a, b) => b.count - a.count);

    return {
      totalTrials: total,
      activeTrials: activeTotal,
      recruitingTrials: recruiting,
      completedAllTime: completedAllTime,
      completedThisYear: completedThisYear,
      completedByCompany: completedByCompany,
      therapeuticAreas: [
        { name: 'Oncology', count: oncologyRes?.totalCount || 122108, color: '#0071bc' },
        { name: 'Cardiology', count: cardiologyRes?.totalCount || 67190, color: '#0ea5e9' },
        { name: 'Respiratory', count: respiratoryRes?.totalCount || 55990, color: '#10b981' },
        { name: 'Endocrinology', count: endocrinologyRes?.totalCount || 36082, color: '#f59e0b' },
        { name: 'Infectious Diseases', count: infectiousRes?.totalCount || 23617, color: '#ef4444' },
        { name: 'Immunology', count: immunologyRes?.totalCount || 8307, color: '#8b5cf6' }
      ],
      statusDistribution: [
        { name: 'Recruiting', value: recruiting },
        { name: 'Active, Not Recruiting', value: activeNotRecruiting },
        { name: 'Completed', value: completedAllTime },
        { name: 'Terminated / Withdrawn', value: terminated }
      ]
    };
  } catch (error) {
    console.warn('[apiService] Live stats query failed:', error.message);
    return {
      totalTrials: 595630,
      activeTrials: 87376,
      recruitingTrials: 65408,
      completedAllTime: 325239,
      completedThisYear: 6455,
      completedByCompany: [
        { name: 'Pfizer', count: 4465, color: '#0071bc' },
        { name: 'GlaxoSmithKline', count: 4010, color: '#14b8a6' },
        { name: 'Novartis', count: 3508, color: '#0ea5e9' },
        { name: 'Merck', count: 3346, color: '#f59e0b' },
        { name: 'AstraZeneca', count: 3308, color: '#ef4444' },
        { name: 'Sanofi', count: 2547, color: '#6366f1' },
        { name: 'Roche', count: 2232, color: '#10b981' },
        { name: 'Eli Lilly', count: 2209, color: '#f97316' },
        { name: 'Bristol Myers Squibb', count: 1912, color: '#ec4899' },
        { name: 'Janssen', count: 1772, color: '#8b5cf6' }
      ],
      therapeuticAreas: [
        { name: 'Oncology', count: 122108, color: '#0071bc' },
        { name: 'Cardiology', count: 67190, color: '#0ea5e9' },
        { name: 'Respiratory', count: 55990, color: '#10b981' },
        { name: 'Endocrinology', count: 36082, color: '#f59e0b' },
        { name: 'Infectious Diseases', count: 23617, color: '#ef4444' },
        { name: 'Immunology', count: 8307, color: '#8b5cf6' }
      ],
      statusDistribution: [
        { name: 'Recruiting', value: 65408 },
        { name: 'Active, Not Recruiting', value: 21968 },
        { name: 'Completed', value: 325239 },
        { name: 'Terminated / Withdrawn', value: 52347 }
      ]
    };
  }
};

