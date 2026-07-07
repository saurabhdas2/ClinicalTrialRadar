// Mock clinical trials and drug label data for fallback and high-fidelity local rendering.

export const MOCK_TRIALS = [
  {
    nctId: "NCT05214691",
    title: "Efficacy and Safety of Comirnaty Duo in Older Adults",
    officialTitle: "A Phase 3, Randomized, Double-Blind Study to Evaluate the Safety, Tolerability, and Immunogenicity of Comirnaty Duo in Adults Aged 65 Years and Older",
    sponsor: "Pfizer",
    status: "COMPLETED",
    startDate: "2024-03-12",
    completionDate: "2026-02-15", // Completed in 2026!
    summary: "This study evaluates the enhanced formulation of the Comirnaty booster vaccine designed to target multiple Omicron sublineages in elder cohorts. Primary endpoints include antibody titers and adverse event rates within 6 months post-vaccination.",
    conditions: ["COVID-19", "Viral Infection", "Respiratory Diseases"],
    phases: ["PHASE3"],
    minimumAge: "65 Years",
    maximumAge: "99 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Adults aged 65 years and older\n- Good general health or stable chronic conditions\n- Completed primary vaccination series at least 6 months ago\n\nExclusion Criteria:\n- Known history of severe allergic reaction to vaccine ingredients\n- Immunosuppressive therapy within past 3 months\n- Active respiratory infection at baseline",
    locations: [
      { facility: "New York Medical Research Center", city: "New York", state: "New York", country: "United States" },
      { facility: "Boston Geriatric Health Center", city: "Boston", state: "Massachusetts", country: "United States" }
    ],
    therapeuticArea: "Infectious Diseases"
  },
  {
    nctId: "NCT06182944",
    title: "Keytruda Combination Therapy for Advanced Non-Small Cell Lung Cancer (NSCLC)",
    officialTitle: "A Phase 3 Study of Pembrolizumab (Keytruda) in Combination with Novel Chemotherapy Agents for First-Line Treatment of Metastatic NSCLC",
    sponsor: "Merck",
    status: "RECRUITING",
    startDate: "2024-09-01",
    completionDate: "2027-08-30",
    summary: "This trial investigates the survival benefits and progression-free progression of Pembrolizumab combined with next-generation chemotherapy versus pembrolizumab alone in patients with metastatic squamous and non-squamous non-small cell lung cancer.",
    conditions: ["Non-Small Cell Lung Cancer", "Lung Cancer", "Oncology"],
    phases: ["PHASE3"],
    minimumAge: "18 Years",
    maximumAge: "80 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Pathologically confirmed Stage IV Non-Small Cell Lung Cancer\n- No prior systemic chemotherapy for metastatic disease\n- ECOG performance status of 0 or 1\n\nExclusion Criteria:\n- Active brain metastases unless treated and stable\n- History of autoimmune disease requiring systemic steroids\n- Prior treatment with anti-PD-1 or anti-PD-L1 immunotherapy",
    locations: [
      { facility: "MD Anderson Cancer Center", city: "Houston", state: "Texas", country: "United States" },
      { facility: "Mayo Clinic", city: "Rochester", state: "Minnesota", country: "United States" },
      { facility: "Stanford Cancer Institute", city: "Stanford", state: "California", country: "United States" }
    ],
    therapeuticArea: "Oncology"
  },
  {
    nctId: "NCT05987123",
    title: "Safety and Efficacy of Alecensa in Early-Stage ALK-Positive Lung Cancer",
    officialTitle: "A Phase 2 Study of Alectinib (Alecensa) in Patients with ALK-Positive Non-Small Cell Lung Cancer Following Surgical Resection",
    sponsor: "Roche",
    status: "RECRUITING",
    startDate: "2025-01-10",
    completionDate: "2028-06-30",
    summary: "Evaluating whether adjuvant Alectinib improves disease-free survival in patients with stage IB-IIIA ALK-positive non-small cell lung cancer who have undergone complete surgical tumor resection.",
    conditions: ["ALK-positive Lung Cancer", "Lung Cancer", "Oncology"],
    phases: ["PHASE2"],
    minimumAge: "18 Years",
    maximumAge: "75 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Documented ALK-positive non-small cell lung cancer\n- Completely resected stage IB, II, or IIIA disease\n- Recovered from all major toxicities of surgery\n\nExclusion Criteria:\n- Prior exposure to ALK inhibitors (e.g., crizotinib, ceritinib)\n- Concurrent malignancy of other organ systems\n- Uncontrolled cardiac disease or arrhythmias",
    locations: [
      { facility: "UCSF Helen Diller Family Comprehensive Cancer Center", city: "San Francisco", state: "California", country: "United States" },
      { facility: "Princess Margaret Cancer Centre", city: "Toronto", state: "Ontario", country: "Canada" }
    ],
    therapeuticArea: "Oncology"
  },
  {
    nctId: "NCT04879201",
    title: "Entresto vs. Standard ACE Inhibitor in Pediatric Heart Failure",
    officialTitle: "A Phase 3, Multi-Center, Open-Label Active-Controlled Trial of Sacubitril/Valsartan (Entresto) in Pediatric Patients with Heart Failure",
    sponsor: "Novartis",
    status: "COMPLETED",
    startDate: "2021-05-20",
    completionDate: "2026-05-10", // Completed in 2026!
    summary: "This trial compared the efficacy and safety of Entresto against Enalapril in children (aged 1 to 18 years) suffering from systemic left ventricular dysfunction and heart failure symptomatology.",
    conditions: ["Heart Failure", "Cardiovascular Diseases", "Pediatric Heart Failure"],
    phases: ["PHASE3"],
    minimumAge: "1 Years",
    maximumAge: "18 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Age 1 year to less than 18 years\n- Diagnosed heart failure with systemic left ventricular ejection fraction <= 40%\n- Patient/Guardian willing to provide informed consent\n\nExclusion Criteria:\n- Prior adverse event associated with ACE inhibitors or ARBs\n- Severe renal impairment (eGFR < 30 mL/min/1.73m2)\n- Listed for urgent heart transplantation",
    locations: [
      { facility: "Children's Hospital of Philadelphia", city: "Philadelphia", state: "Pennsylvania", country: "United States" },
      { facility: "Great Ormond Street Hospital", city: "London", state: "", country: "United Kingdom" }
    ],
    therapeuticArea: "Cardiology"
  },
  {
    nctId: "NCT05663810",
    title: "Moderna mRNA Vaccine for Respiratory Syncytial Virus (RSV) in Infancy",
    officialTitle: "A Phase 1/2 Study to Evaluate the Safety, Reactogenicity, and Immunogenicity of mRNA-1345 in Healthy Infants and Toddlers",
    sponsor: "Moderna",
    status: "RECRUITING",
    startDate: "2025-04-01",
    completionDate: "2027-04-01",
    summary: "Determining safety profile, dosage guidelines, and immune response of Moderna's investigational mRNA-1345 vaccine targeting RSV fusion protein in young pediatric cohorts.",
    conditions: ["RSV Infection", "Respiratory Syncytial Virus", "Infectious Diseases"],
    phases: ["PHASE1", "PHASE2"],
    minimumAge: "6 Months",
    maximumAge: "2 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Healthy infants/toddlers aged 6 months to 24 months\n- Up-to-date on all recommended childhood immunizations\n- Parents/guardians able to maintain electronic daily diaries\n\nExclusion Criteria:\n- Born prematurely (gestational age < 36 weeks)\n- History of asthma, reactive airway disease, or wheezing episodes\n- Prior receipt of monoclonal antibodies targeting RSV (e.g., palivizumab)",
    locations: [
      { facility: "Seattle Children's Hospital", city: "Seattle", state: "Washington", country: "United States" },
      { facility: "Texas Children's Hospital", city: "Houston", state: "Texas", country: "United States" }
    ],
    therapeuticArea: "Infectious Diseases"
  },
  {
    nctId: "NCT05021132",
    title: "Leqembi for Early Alzheimer's Disease Prevention and Treatment",
    officialTitle: "A Phase 3, Multi-Center, Double-Blind Study of Lecanemab (Leqembi) in Subjects with Mild Cognitive Impairment or Early Alzheimer's Disease",
    sponsor: "Eisai",
    status: "ACTIVE_NOT_RECRUITING",
    startDate: "2021-10-15",
    completionDate: "2026-09-30", // Completing in late 2026!
    summary: "Evaluates the long-term safety, cognitive efficacy, and amyloid clearance properties of Leqembi (Lecanemab) administered intravenously biweekly in individuals showing early clinical signs of Alzheimer's dementia.",
    conditions: ["Alzheimer Disease", "Cognitive Impairment", "Neurology"],
    phases: ["PHASE3"],
    minimumAge: "50 Years",
    maximumAge: "90 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Subject meets criteria for early Alzheimer's disease or Mild Cognitive Impairment\n- Objective memory impairment on cognitive tests\n- Positive amyloid PET scan or CSF biomarkers\n\nExclusion Criteria:\n- History of significant cerebral vascular disease or hemorrhage\n- Unstable medical conditions (e.g., severe renal or liver disease)\n- Current enrollment in another investigational drug trial",
    locations: [
      { facility: "Cleveland Clinic Brain Health Center", city: "Las Vegas", state: "Nevada", country: "United States" },
      { facility: "Johns Hopkins Medicine", city: "Baltimore", state: "Maryland", country: "United States" }
    ],
    therapeuticArea: "Neurology"
  },
  {
    nctId: "NCT05834927",
    title: "AstraZeneca Trial of Farxiga in Chronic Kidney Disease Progression",
    officialTitle: "A Phase 4 Study to Evaluate Real-World Effectiveness of Dapagliflozin (Farxiga) on Glomerular Filtration Rate Decline in Patients with Advanced CKD",
    sponsor: "AstraZeneca",
    status: "RECRUITING",
    startDate: "2024-01-20",
    completionDate: "2026-11-20", // Completing this year
    summary: "This Phase 4 post-marketing observational trial tracks the slope of GFR decline and cardiovascular events in patients with Stage 4 Chronic Kidney Disease who are newly initiated on Farxiga.",
    conditions: ["Chronic Kidney Disease", "Kidney Diseases", "Nephrology"],
    phases: ["PHASE4"],
    minimumAge: "18 Years",
    maximumAge: "85 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Age 18 to 85 years\n- Documented Stage 4 Chronic Kidney Disease (eGFR between 15 and 30)\n- Stable dose of ACE inhibitor or ARB for at least 4 weeks\n\nExclusion Criteria:\n- Type 1 Diabetes Mellitus\n- History of kidney transplant or expected to start dialysis within 3 months\n- Severe hepatic impairment (Child-Pugh Class C)",
    locations: [
      { facility: "Chicago Nephrology Clinic", city: "Chicago", state: "Illinois", country: "United States" },
      { facility: "London Renal Clinic", city: "London", state: "", country: "United Kingdom" }
    ],
    therapeuticArea: "Nephrology"
  },
  {
    nctId: "NCT06214560",
    title: "Opdivo Adjuvant Therapy in Resected Melanoma Patients",
    officialTitle: "A Phase 3, Double-Blind Study of Nivolumab (Opdivo) vs Placebo in Patients with Stage IIB/C Melanoma Following Resection",
    sponsor: "Bristol Myers Squibb",
    status: "RECRUITING",
    startDate: "2024-11-10",
    completionDate: "2027-12-15",
    summary: "This trial measures the recurrence-free survival rates of patients with resected high-risk stage IIB/C melanoma receiving adjuvant Nivolumab infusions compared to a placebo control group.",
    conditions: ["Melanoma", "Skin Cancer", "Oncology"],
    phases: ["PHASE3"],
    minimumAge: "12 Years",
    maximumAge: "90 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Age 12 years and older\n- Completely resected stage IIB or IIC histologically confirmed melanoma\n- Disease-free status confirmed by imaging within 4 weeks of randomisation\n\nExclusion Criteria:\n- Prior systemic treatment for melanoma\n- Active autoimmune disease requiring systemic corticosteroids\n- Pregnant or breastfeeding patients",
    locations: [
      { facility: "Melanoma Center of excellence", city: "Miami", state: "Florida", country: "United States" },
      { facility: "Gustave Roussy Cancer Center", city: "Paris", state: "", country: "France" }
    ],
    therapeuticArea: "Oncology"
  },
  {
    nctId: "NCT05432109",
    title: "Novartis Kisqali Adjuvant Treatment in Hormone Receptor Positive Breast Cancer",
    officialTitle: "A Phase 3 Study to Evaluate Adjuvant Ribociclib (Kisqali) in Stage II and III HR+/HER2- Early Breast Cancer",
    sponsor: "Novartis",
    status: "COMPLETED",
    startDate: "2023-02-15",
    completionDate: "2026-04-12", // Completed in 2026!
    summary: "This trial evaluated whether Ribociclib combined with standard endocrine therapy improves invasive disease-free survival in pre- and post-menopausal women with HR+/HER2- early breast cancer.",
    conditions: ["Breast Cancer", "Hormone Receptor Positive Breast Cancer", "Oncology"],
    phases: ["PHASE3"],
    minimumAge: "18 Years",
    maximumAge: "80 Years",
    sex: "FEMALE",
    criteriaText: "Inclusion Criteria:\n- Female patients aged 18 to 80 years\n- Pathologically confirmed HR+/HER2- invasive early breast cancer\n- High risk of recurrence based on nodal status or tumor size\n\nExclusion Criteria:\n- Distant metastatic disease (Stage IV)\n- Clinically significant cardiovascular conditions or QT prolongation\n- Prior treatment with any CDK4/6 inhibitor",
    locations: [
      { facility: "Massachusetts General Hospital", city: "Boston", state: "Massachusetts", country: "United States" },
      { facility: "Royal Marsden Hospital", city: "London", state: "", country: "United Kingdom" }
    ],
    therapeuticArea: "Oncology"
  },
  {
    nctId: "NCT05310899",
    title: "Eli Lilly Mounjaro for Obesity and Cardiovascular Risk Reduction",
    officialTitle: "A Phase 3 Trial of Tirzepatide (Mounjaro) in Adults with Obesity and Established Cardiovascular Disease",
    sponsor: "Eli Lilly",
    status: "RECRUITING",
    startDate: "2023-08-01",
    completionDate: "2026-10-31", // Completing in 2026!
    summary: "Investigating the reduction in major adverse cardiovascular events (MACE) and percentage body weight change in obese non-diabetic adults treated with weekly subcutaneous injections of Tirzepatide.",
    conditions: ["Obesity", "Cardiovascular Diseases", "Weight Loss"],
    phases: ["PHASE3"],
    minimumAge: "18 Years",
    maximumAge: "75 Years",
    sex: "ALL",
    criteriaText: "Inclusion Criteria:\n- Age >= 18 and <= 75 years\n- Body Mass Index (BMI) >= 30 kg/m2\n- Established cardiovascular disease (prior MI, stroke, or peripheral arterial disease)\n\nExclusion Criteria:\n- Diagnosed Type 1 or Type 2 Diabetes Mellitus\n- History of medullary thyroid carcinoma or MEN 2 syndrome\n- Severe heart failure (NYHA Class IV)",
    locations: [
      { facility: "Vanderbilt University Medical Center", city: "Nashville", state: "Tennessee", country: "United States" },
      { facility: "Cedars-Sinai Medical Center", city: "Los Angeles", state: "California", country: "United States" }
    ],
    therapeuticArea: "Cardiology"
  }
];

export const MOCK_DRUGS = {
  "advil": {
    brandName: "Advil",
    genericName: "Ibuprofen",
    activeIngredient: "Ibuprofen 200mg",
    manufacturer: "Pfizer",
    indications: "Temporarily relieves minor aches and pains due to: headache, toothache, backache, menstrual cramps, the common cold, muscular aches, minor pain of arthritis. Temporarily reduces fever.",
    warnings: "Allergy alert: Ibuprofen may cause a severe allergic reaction. Stomach bleeding warning: This product contains an NSAID, which may cause severe stomach bleeding. Heart attack and stroke warning: NSAIDs, except aspirin, increase the risk of heart attack, heart failure, and stroke.",
    dosage: "Adults and children 12 years and older: Take 1 tablet every 4 to 6 hours while symptoms persist. If pain or fever does not respond to 1 tablet, 2 tablets may be used. Do not exceed 6 tablets in 24 hours.",
    sideEffects: "Stomach upset, mild heartburn, nausea, vomiting, bloating, gas, diarrhea, constipation, dizziness, headache, nervousness, mild itching or rash, ringing in ears."
  },
  "tylenol": {
    brandName: "Tylenol",
    genericName: "Acetaminophen",
    activeIngredient: "Acetaminophen 500mg",
    manufacturer: "McNeil Consumer Healthcare",
    indications: "Temporarily relieves minor aches and pains due to: the common cold, headache, backache, minor pain of arthritis, toothache, muscular aches, premenstrual and menstrual cramps. Temporarily reduces fever.",
    warnings: "Liver warning: This product contains acetaminophen. Severe liver damage may occur if you take more than 4,000 mg of acetaminophen in 24 hours, take with other drugs containing acetaminophen, or consume 3 or more alcoholic drinks daily.",
    dosage: "Adults and children 12 years and over: Take 2 gelcaps every 6 hours while symptoms last. Do not take more than 6 gelcaps in 24 hours, unless directed by a doctor. Do not use for more than 10 days.",
    sideEffects: "Nausea, upper stomach pain, itching, loss of appetite, dark urine, clay-colored stools, jaundice (yellowing of skin or eyes). Allergic reactions are rare but can include skin rash and swelling."
  },
  "aspirin": {
    brandName: "Bayer Aspirin",
    genericName: "Aspirin",
    activeIngredient: "Aspirin 325mg",
    manufacturer: "Bayer",
    indications: "Temporarily relieves minor aches and pains due to: headache, muscle pain, toothache, menstrual pain, minor pain of arthritis, colds. Temporarily reduces fever. Also used under physician guidance for cardiovascular cardioprotection.",
    warnings: "Reye's syndrome: Children and teenagers who have or are recovering from chicken pox or flu-like symptoms should not use this product. Stomach bleeding warning: NSAID caution for gastrointestinal bleeding risk.",
    dosage: "Adults and children 12 years and over: Take 1 to 2 tablets every 4 hours, or 3 tablets every 6 hours, not to exceed 12 tablets in 24 hours, unless directed by a doctor.",
    sideEffects: "Heartburn, nausea, vomiting, stomach pain, increased bleeding risk, bruising, ringing in ears, hearing loss, hives, difficulty breathing."
  },
  "lipitor": {
    brandName: "Lipitor",
    genericName: "Atorvastatin Calcium",
    activeIngredient: "Atorvastatin 10mg / 20mg / 40mg / 80mg",
    manufacturer: "Viatris / Pfizer",
    indications: "Indicated as an adjunct to diet to reduce elevated total cholesterol, LDL-cholesterol, apolipoprotein B, and triglycerides in patients with primary hypercholesterolemia. Prevents cardiovascular disease events.",
    warnings: "Myopathy and Rhabdomyolysis: Statins can cause muscle aches or severe muscle breakdown. Liver dysfunction: Monitor liver enzymes before and during treatment. Avoid in pregnant or nursing patients.",
    dosage: "Usual starting dose is 10 or 20 mg once daily. The dosage range is 10 mg to 80 mg once daily. Can be taken at any time of day, with or without food.",
    sideEffects: "Joint pain, diarrhea, nasopharyngitis (stuffy nose/throat), muscle pain, muscle spasms, urinary tract infection, nausea, limb pain."
  },
  "keytruda": {
    brandName: "Keytruda",
    genericName: "Pembrolizumab",
    activeIngredient: "Pembrolizumab 100mg/4mL",
    manufacturer: "Merck & Co.",
    indications: "A prescription immunotherapy medicine used to treat advanced melanoma, non-small cell lung cancer, squamous cell carcinoma of the head and neck, classical Hodgkin lymphoma, and other advanced cancers expressing high PD-L1.",
    warnings: "Immune-Mediated Adverse Reactions: Can cause severe or fatal reactions in any organ system (e.g., pneumonitis, colitis, hepatitis, endocrinopathies, nephritis). Infusion-related reactions can also occur.",
    dosage: "Administered as an intravenous infusion over 30 minutes. Recommended dose is 200 mg every 3 weeks or 400 mg every 6 weeks until disease progression or unacceptable toxicity.",
    sideEffects: "Feeling tired, pain in muscles or bones, decreased appetite, itchy skin, diarrhea, nausea, fever, cough, shortness of breath, constipation."
  }
};

// Default Company Timelines (Interactive Recharts dashboard support)
export const MOCK_COMPANY_METRICS = {
  "Pfizer": {
    years: [
      { year: "2018", active: 45, completed: 30 },
      { year: "2019", active: 50, completed: 35 },
      { year: "2020", active: 65, completed: 42 },
      { year: "2021", active: 78, completed: 48 },
      { year: "2022", active: 82, completed: 52 },
      { year: "2023", active: 90, completed: 60 },
      { year: "2024", active: 95, completed: 68 },
      { year: "2025", active: 104, completed: 78 },
      { year: "2026", active: 88, completed: 45 } // Current year
    ],
    status: [
      { name: "Recruiting", value: 38 },
      { name: "Active, Not Recruiting", value: 24 },
      { name: "Completed", value: 45 },
      { name: "Terminated / Suspended", value: 6 }
    ],
    phases: [
      { phase: "Phase 1", count: 20 },
      { phase: "Phase 2", count: 28 },
      { phase: "Phase 3", count: 42 },
      { phase: "Phase 4", count: 23 }
    ],
    therapeuticAreas: [
      { name: "Oncology", count: 32 },
      { name: "Infectious Diseases", count: 28 },
      { name: "Cardiology", count: 18 },
      { name: "Immunology", count: 15 },
      { name: "Rare Diseases", count: 20 }
    ],
    approvedDrugs: ["Advil", "Lipitor", "Prevnar 20", "Paxlovid", "Xeljanz"]
  },
  "Novartis": {
    years: [
      { year: "2018", active: 38, completed: 25 },
      { year: "2019", active: 42, completed: 28 },
      { year: "2020", active: 48, completed: 30 },
      { year: "2021", active: 56, completed: 38 },
      { year: "2022", active: 62, completed: 44 },
      { year: "2023", active: 70, completed: 48 },
      { year: "2024", active: 78, completed: 55 },
      { year: "2025", active: 84, completed: 62 },
      { year: "2026", active: 72, completed: 34 }
    ],
    status: [
      { name: "Recruiting", value: 28 },
      { name: "Active, Not Recruiting", value: 20 },
      { name: "Completed", value: 34 },
      { name: "Terminated / Suspended", value: 4 }
    ],
    phases: [
      { phase: "Phase 1", count: 15 },
      { phase: "Phase 2", count: 25 },
      { phase: "Phase 3", count: 32 },
      { phase: "Phase 4", count: 14 }
    ],
    therapeuticAreas: [
      { name: "Oncology", count: 25 },
      { name: "Neurology", count: 22 },
      { name: "Cardiology", count: 14 },
      { name: "Ophthalmology", count: 12 },
      { name: "Immunology", count: 13 }
    ],
    approvedDrugs: ["Entresto", "Gilenya", "Cosentyx", "Kisqali", "Zolgensma"]
  },
  "Roche": {
    years: [
      { year: "2018", active: 40, completed: 22 },
      { year: "2019", active: 45, completed: 26 },
      { year: "2020", active: 52, completed: 31 },
      { year: "2021", active: 60, completed: 35 },
      { year: "2022", active: 68, completed: 40 },
      { year: "2023", active: 75, completed: 45 },
      { year: "2024", active: 83, completed: 50 },
      { year: "2025", active: 90, completed: 58 },
      { year: "2026", active: 78, completed: 30 }
    ],
    status: [
      { name: "Recruiting", value: 34 },
      { name: "Active, Not Recruiting", value: 22 },
      { name: "Completed", value: 30 },
      { name: "Terminated / Suspended", value: 5 }
    ],
    phases: [
      { phase: "Phase 1", count: 18 },
      { phase: "Phase 2", count: 30 },
      { phase: "Phase 3", count: 35 },
      { phase: "Phase 4", count: 8 }
    ],
    therapeuticAreas: [
      { name: "Oncology", count: 45 },
      { name: "Neurology", count: 18 },
      { name: "Immunology", count: 12 },
      { name: "Infectious Diseases", count: 8 },
      { name: "Rare Diseases", count: 8 }
    ],
    approvedDrugs: ["Alecensa", "Herceptin", "Avastin", "Ocrevus", "Rituxan"]
  },
  "Merck": {
    years: [
      { year: "2018", active: 30, completed: 18 },
      { year: "2019", active: 35, completed: 20 },
      { year: "2020", active: 42, completed: 25 },
      { year: "2021", active: 48, completed: 29 },
      { year: "2022", active: 54, completed: 32 },
      { year: "2023", active: 62, completed: 38 },
      { year: "2024", active: 69, completed: 44 },
      { year: "2025", active: 75, completed: 48 },
      { year: "2026", active: 65, completed: 25 }
    ],
    status: [
      { name: "Recruiting", value: 25 },
      { name: "Active, Not Recruiting", value: 18 },
      { name: "Completed", value: 25 },
      { name: "Terminated / Suspended", value: 3 }
    ],
    phases: [
      { phase: "Phase 1", count: 12 },
      { phase: "Phase 2", count: 20 },
      { phase: "Phase 3", count: 28 },
      { phase: "Phase 4", count: 11 }
    ],
    therapeuticAreas: [
      { name: "Oncology", count: 35 },
      { name: "Infectious Diseases", count: 15 },
      { name: "Cardiology", count: 8 },
      { name: "Immunology", count: 7 },
      { name: "Diabetes/Endocrine", count: 6 }
    ],
    approvedDrugs: ["Keytruda", "Gardasil 9", "Januvia", "Singulair", "Belsomra"]
  },
  "Moderna": {
    years: [
      { year: "2018", active: 5, completed: 1 },
      { year: "2019", active: 8, completed: 3 },
      { year: "2020", active: 18, completed: 6 },
      { year: "2021", active: 25, completed: 10 },
      { year: "2022", active: 28, completed: 12 },
      { year: "2023", active: 32, completed: 15 },
      { year: "2024", active: 36, completed: 18 },
      { year: "2025", active: 40, completed: 22 },
      { year: "2026", active: 32, completed: 12 }
    ],
    status: [
      { name: "Recruiting", value: 16 },
      { name: "Active, Not Recruiting", value: 8 },
      { name: "Completed", value: 12 },
      { name: "Terminated / Suspended", value: 1 }
    ],
    phases: [
      { phase: "Phase 1", count: 10 },
      { phase: "Phase 2", count: 14 },
      { phase: "Phase 3", count: 12 },
      { phase: "Phase 4", count: 1 }
    ],
    therapeuticAreas: [
      { name: "Infectious Diseases", count: 22 },
      { name: "Oncology", count: 10 },
      { name: "Rare Diseases", count: 3 },
      { name: "Cardiology", count: 2 }
    ],
    approvedDrugs: ["Spikevax", "mRESVIA"]
  },
  "AstraZeneca": {
    years: [
      { year: "2018", active: 35, completed: 20 },
      { year: "2019", active: 40, completed: 24 },
      { year: "2020", active: 48, completed: 28 },
      { year: "2021", active: 58, completed: 35 },
      { year: "2022", active: 65, completed: 40 },
      { year: "2023", active: 72, completed: 45 },
      { year: "2024", active: 80, completed: 50 },
      { year: "2025", active: 87, completed: 56 },
      { year: "2026", active: 74, completed: 28 }
    ],
    status: [
      { name: "Recruiting", value: 29 },
      { name: "Active, Not Recruiting", value: 21 },
      { name: "Completed", value: 28 },
      { name: "Terminated / Suspended", value: 4 }
    ],
    phases: [
      { phase: "Phase 1", count: 14 },
      { phase: "Phase 2", count: 26 },
      { phase: "Phase 3", count: 30 },
      { phase: "Phase 4", count: 12 }
    ],
    therapeuticAreas: [
      { name: "Oncology", count: 30 },
      { name: "Cardiology", count: 18 },
      { name: "Respiratory / Immunology", count: 16 },
      { name: "Renal / Nephrology", count: 10 },
      { name: "Rare Diseases", count: 8 }
    ],
    approvedDrugs: ["Farxiga", "Tagrisso", "Imfinzi", "Lynparza", "Symbicort"]
  }
};

export const DEFAULT_GLOBAL_STATS = {
  totalTrials: 456201,
  completedThisYear: 2480, // Completed in 2026
  activeTrials: 14210,
  recruitingTrials: 8945,
  therapeuticAreas: [
    { name: "Oncology", count: 4850, color: "#1d4ed8" },
    { name: "Cardiology", count: 2910, color: "#0ea5e9" },
    { name: "Neurology", count: 2130, color: "#06b6d4" },
    { name: "Infectious Diseases", count: 1820, color: "#10b981" },
    { name: "Immunology", count: 1480, color: "#8b5cf6" },
    { name: "Endocrinology", count: 1020, color: "#f59e0b" }
  ],
  statusDistribution: [
    { name: "Recruiting", value: 8945 },
    { name: "Active, Not Recruiting", value: 5265 },
    { name: "Completed", value: 4210 },
    { name: "Terminated / Withdrawn", value: 890 }
  ],
  companyCounts: [
    { name: "Pfizer", count: 128 },
    { name: "Novartis", count: 110 },
    { name: "Roche", count: 115 },
    { name: "Merck", count: 96 },
    { name: "AstraZeneca", count: 108 },
    { name: "Moderna", count: 37 }
  ]
};
