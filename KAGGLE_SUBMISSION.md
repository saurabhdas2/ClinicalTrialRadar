# Clinical Trial Radar — Kaggle Submission Writeup

---

## BASIC DETAILS

---

### Title (Required to save)
```
Clinical Trial Radar — Global Clinical Trial Intelligence Platform
```

### Subtitle
```
An agentic web app integrating ClinicalTrials.gov V2 & OpenFDA to deliver real-time trial discovery, eligibility matching, drug insights, and company-wise pharma analytics — powered by a natural-language AI Agent.
```

---

### Card and Thumbnail Image

**Generated Thumbnail:** `public/kaggle_thumbnail.png` ✅

![Clinical Trial Radar — Kaggle Thumbnail](file:///Users/saurabhdas/Documents/agy-projects/ClinicalTrialRadar/public/kaggle_thumbnail.png)


---

### Video

**▶️ Demo Video:** [https://youtu.be/lJzXiPz1eA4](https://youtu.be/lJzXiPz1eA4)

> A 12-second walkthrough of all 10 views: Dashboard → Clinical Search → Trial Modal → Eligibility Matcher → OpenFDA Drug Search → Company Insights → Trial Radar AI Agent.



---

## CONTENT

---

### Project Description

#### Overview

**Clinical Trial Radar** is a full-featured clinical trial intelligence platform that provides real-time, data-driven insights into the global landscape of clinical research. It integrates two major public data repositories — [ClinicalTrials.gov V2 API](https://clinicaltrials.gov/data-api/api) and the [OpenFDA Drug Label API](https://open.fda.gov/apis/drug/label/) — to deliver a unified experience for patients, researchers, and pharmaceutical analysts.

The platform features an **agentic AI layer** — a built-in conversational intelligence engine that understands natural language queries, decomposes them into multi-step research actions (fetching from live APIs, parsing eligibility criteria, scoring candidates), and renders rich, interactive results directly in the chat thread.

---

#### Problem Statement

The global clinical trial ecosystem generates an enormous amount of publicly available data, yet accessing it remains fragmented and technically demanding. Key challenges include:

- **For patients**: Identifying clinical trials you may actually qualify for requires reading dense eligibility criteria across multiple databases.
- **For researchers**: Synthesizing sponsor-level pipeline activity (trial counts, phase distributions, therapeutic focus) requires manual aggregation.
- **For analysts**: Comparing pharmaceutical company R&D velocity across years requires custom data pipelines.
- **For clinicians**: Cross-referencing FDA-approved drug labels (side effects, warnings, dosage) against trial protocols is tedious and disconnected.

**Clinical Trial Radar solves all four problems** in a single, unified, visually polished interface.

---

#### Key Features

**1. 🏠 Global Dashboard**
- Real-time KPI cards: 456,000+ total studies, 14,210 active trials, 8,945 recruiting, 2,480 completed in 2026
- Fully interactive **Donut Pie Chart** — trial status distribution with hover tooltips
- Fully interactive **Horizontal Bar Chart** — trials by therapeutic area (Oncology, Cardiology, Neurology, Infectious Diseases, Immunology, Endocrinology)
- **Live recent trials feed** table from ClinicalTrials.gov V2 with status badges, phase indicators, and one-click detail modals

**2. 🔍 Multi-Attribute Clinical Search**
- Filter by: keyword, specific condition/disease, sponsor company, study phase (Phase 1–4), and overall status
- Results rendered as a 2-column card grid with condition tags, sponsor, completion date, and status
- Full **trial detail modal** showing: official scientific title, study summary, eligibility criteria (inclusion/exclusion), age/gender requirements, and site locations

**3. 🩺 Eligibility Matcher**
- Patient intake form: age, gender, primary condition, symptoms/comorbidities
- Proprietary **client-side eligibility scoring engine**:
  - Parses `minimumAge` / `maximumAge` including month/week/year conversions
  - Checks gender restriction flags
  - Scores condition keyword alignment
  - Scans free-text exclusion criteria for symptom/drug conflicts
- Results sorted: **✅ Highly Eligible → ⚠️ Partial Match → ❌ Ineligible**
- Expandable cards with per-criterion ✅/❌ checklist and plain-English explanation

**4. 💊 OpenFDA Drug Search + Comparator**
- Live query of the FDA Drug Label API by brand name, generic name, or active ingredient
- Full structured label panel: active ingredients, indications & usage, ⚠️ warnings, 🚨 adverse reactions, dosage guidelines
- **Side-by-side drug comparison table** — contrast two drugs across all label attributes (color-coded: amber warnings, red adverse events)
- Fallback to curated local entries for Advil, Tylenol, Aspirin, Lipitor, and Keytruda

**5. 🏢 Company Insights (Type-Ahead Search)**
- Type-ahead autocomplete for 6 major pharma sponsors (Pfizer, Novartis, Roche, Merck, AstraZeneca, Moderna) plus any custom company name
- Per-company **deep analytics dashboard**:
  - **Area chart** — Active vs Completed trial timeline (2018–2026)
  - **Pie chart** — Portfolio status breakdown (Recruiting, Active Not Recruiting, Completed, Terminated)
  - **Bar chart** — Phase distribution (Phase 1 → Phase 4)
  - **Therapeutic focus table** — concentration percentages with inline progress bars
  - **FDA approved products** list as pill-badges

**6. 🤖 Trial Radar AI Agent (Agentic Design)**
- Natural language conversational interface
- **5 intent classes** understood automatically:
  - `trial_search` — parses sponsor, phase, status, condition from free text → fetches from ClinicalTrials.gov
  - `drug_search` — identifies drug name → queries OpenFDA → renders inline label card
  - `drug_compare` — extracts two drug names → parallel FDA fetch → inline comparison widget
  - `company_insights` — identifies pharma company → renders pipeline summary card
  - `eligibility_check` — extracts age, gender, condition → scores matched trials → eligibility grid
- **Real-time step-by-step reasoning log** streams at 800ms intervals per step ("Parsing query...", "Fetching from ClinicalTrials.gov...", "Scoring criteria...")
- **Inline dynamic widgets** rendered directly in the chat: trial cards, eligibility grids, drug label cards, comparison tables, company mini-dashboards
- 4 one-click shortcut prompts to demonstrate every intent type

---

#### Technical Architecture & Multi-Agent Design

The application's AI layer is built on a formal, modular **Multi-Agent Orchestrator Architecture** located in the `src/agents/` directory. Rather than relying on simple ad-hoc conditionals, the platform implements a ReAct-style (Reason + Act) loop with stateful session memory and a structured tool execution registry.

```
                                  User Query
                                      │
                                      ▼
                                ┌───────────┐
                                │ Memory    │ ◄─── Session context loaded
                                └─────┬─────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Orchestrator Agent     │ ◄─── Perceives & Classifies Intent
                        │  (agents/orchestrator.js) │
                        └─────────────┬─────────────┘
                                      │
                         Builds plan, pipes inputs to:
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
  ┌──────────────┐             ┌──────────────┐              ┌──────────────┐
  │ TrialSearch  │             │ Eligibility  │              │ Drug/Company │
  │  Sub-Agent   │             │  Sub-Agent   │              │  Sub-Agent   │
  └──────┬───────┘             └──────┬───────┘              └──────┬───────┘
         │                            │                             │
         └────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
                          ┌───────────────────────┐
                          │     Tool Registry     │ ◄─── Validates schema & inputs
                          │ (agents/toolRegistry.js)│
                          └───────────┬───────────┘
                                      │
                 Invokes matching executing tool function:
                                      │
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
 ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
 │ ClinicalTrials│             │   OpenFDA    │              │ Eligibility  │
 │  Search API  │              │  Label API   │              │ Scoring Engine│
 └──────────────┘              └──────────────┘              └──────────────┘
```

##### 1. Master Orchestrator Agent (`src/agents/orchestrator.js`)
Acts as the brain of the AI interface. It:
*   **Perceives:** Receives query and reads recent turn history from `agentMemory.js`.
*   **Classifies Intent:** Parses query into one of 5 distinct intents (`trial_search`, `drug_search`, `drug_compare`, `company_insights`, `eligibility_check`).
*   **Extracts Entities:** Locates condition names, drug names, phases, and sponsor companies.
*   **Plans & Pipes:** Generates a sequence of execution steps, piping the output of one tool as input to the next (e.g., outputs of `search_clinical_trials` piped directly into `score_eligibility`).

##### 2. Tool Registry (`src/agents/toolRegistry.js`)
Implements the **Tool-Augmented Agent** pattern. Tools are defined with OpenAI-compatible function calling schemas (names, descriptions, parameter types, required fields), enabling drop-in compatibility with standard LLMs (like Gemini or GPT) by replacing the parsing logic with function-calling outputs:
*   `search_clinical_trials`: Live ClinicalTrials.gov V2 filter query.
*   `get_trial_details`: Detailed trial protocol loader.
*   `rank_trials_by_relevance`: Relevance indexing based on density.
*   `search_fda_label`: OpenFDA query for warnings/adverse reactions.
*   `compare_drugs`: Parallel label resolver.
*   `parse_patient_profile`: Natural language patient information extractor.
*   `score_eligibility`: Detailed multi-criterion scoring matrix.
*   `get_company_pipeline`: Analytics metric loader.
*   `summarize_trial_landscape`: Statistics accumulator.

##### 3. Eligibility Sub-Agent (`src/agents/eligibilityAgent.js`)
A specialized clinical matching agent. When intent is classified as `eligibility_check`, this agent is spun up to match the compiled patient profile against fetched trials using a three-tier gate system:
*   *Hard Gates:* Numeric age verification (normalized to years) and gender restriction checks.
*   *Soft Gates:* Bidirectional condition keyword overlap check.
*   *Exclusion Gates:* Free-text criteria scan filtering patient symptoms against trial exclusion constraints.

##### 4. Session Memory Module (`src/agents/agentMemory.js`)
Maintains conversation state across multi-turn runs. It tracks:
*   **Entity Cache:** Automatically retains the last searched drug, condition, or company to handle follow-up pronouns (e.g., "Compare Advil and Tylenol" followed by "show its side effects").
*   **Patient Profile:** Caches the parsed age, gender, and conditions for eligibility matching so users do not have to re-enter details.
*   **Tool Output Caching:** Stores previous API responses for instant recall on follow-up turns.

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Charts | Recharts (interactive SVG) |
| Icons | Lucide React |
| Styling | Vanilla CSS with design token system |
| Data Source 1 | ClinicalTrials.gov V2 REST API (public) |
| Data Source 2 | OpenFDA Drug Label REST API (public) |
| Fallback | In-memory API failure recovery layer |
| AI Layer | Client-side NLP intent engine (no LLM API cost) |

---

#### Design Philosophy

The visual design is directly inspired by the **openFDA brand identity** — professional deep navy (`#002b49`), crisp clinical white backgrounds, and a clear diagnostic color system (green for eligible/success, amber for partial/warning, red for ineligible/danger). The typography uses **Inter** and **Outfit** from Google Fonts for a modern, medical-grade reading experience.

Micro-interactions include:
- `fadeInUp` card entrance animations
- `translateY(-1px)` hover lift on cards
- Live pulsing green dot on the top bar (API connection indicator)
- Real-time streaming reasoning steps in the AI agent
- Smooth chart tooltips with formatted counts

---


### Project Links

| Resource | URL / Reference |
|----------|----------------|
| **Live App** | `http://localhost:5173/` (run locally with `npm run dev`) |
| **GitHub Repository** | https://github.com/saurabhdas2/ClinicalTrialRadar |
| **Demo Video (YouTube)** | https://youtu.be/lJzXiPz1eA4 |
| **ClinicalTrials.gov V2 API Docs** | https://clinicaltrials.gov/data-api/api |
| **OpenFDA API Docs** | https://open.fda.gov/apis/drug/label/ |
| **OpenFDA Brand Identity** | https://open.fda.gov |
| **Recharts Library** | https://recharts.org |
| **Lucide Icons** | https://lucide.dev |

---

#### How to Run Locally

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ClinicalTrialRadar

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
open http://localhost:5173
```

**Requirements:** Node.js v18+ · npm v9+


---

#### Sample Queries to Try in the AI Agent

Once the app is running, open the **Trial Radar AI** tab and try these natural language queries:

```
"Find active oncology trials by Roche in Phase 3"
"Am I eligible for Alzheimer's trials if I am 68 years old?"
"Compare side effects of Keytruda and Advil"
"Show me the pipeline metrics for AstraZeneca"
"Search FDA for pembrolizumab drug label"
"Find recruiting cardiology trials by Pfizer"
```

---

*Submitted for the Kaggle AI/ML and Data Products Track · July 2026*
*Data Sources: ClinicalTrials.gov (public domain) · OpenFDA (public domain, CC0)*
