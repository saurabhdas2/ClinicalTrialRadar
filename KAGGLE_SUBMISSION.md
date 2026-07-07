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

> Upload `public/kaggle_thumbnail.png` directly to the Kaggle card image field.

---

### Submission Tracks

- ✅ **Web Application / Data Product**
- ✅ **Healthcare & Life Sciences**
- ✅ **Open Data Integration** (ClinicalTrials.gov + OpenFDA — fully public APIs)
- ✅ **AI / Agentic Systems**
- ✅ **Data Visualization**

---

## MEDIA GALLERY

---

### Images

Below is the list of recommended screenshots to capture from the live app at `http://localhost:5173/` and upload to the gallery:

| # | Screen | Capture Instructions |
|---|--------|----------------------|
| 1 | **Dashboard — Hero Banner + KPI Cards** | Full-page screenshot of the opening dashboard view showing the navy hero banner, 4 KPI stat cards, and the top of the two Recharts |
| 2 | **Dashboard — Interactive Charts** | Scroll to show the Pie Chart (trial status distribution) and the Horizontal Bar Chart (trials by therapeutic area) side-by-side |
| 3 | **Clinical Search — Results Grid** | Search for "cancer" to populate the 2-column trial card grid. Show one card expanded with status badge and sponsor info |
| 4 | **Trial Detail Modal** | Click the eye icon on any trial to show the full details modal: official title, criteria, age limits, locations |
| 5 | **Eligibility Matcher — Results** | Enter Age=65, Condition=Heart Failure and click "Run Eligibility Matcher". Show the scored results: green Eligible, amber Partial |
| 6 | **OpenFDA Drug Search** | Search "Keytruda" to show the full label panel: indications, warnings (amber box), adverse reactions (red box) |
| 7 | **Drug Comparison Table** | Switch to "Side-by-Side Comparator" tab, compare Advil vs Tylenol. Show the full comparison table |
| 8 | **Company Insights — Pfizer** | Show the Pfizer dashboard: navy header card, Area chart timeline (2018–2026), Pie chart, Phase bar chart |
| 9 | **Company Insights — Type-Ahead** | Show the type-ahead dropdown mid-search (e.g., typing "Roc" with "Roche" suggestion highlighted) |
| 10 | **Trial Radar AI — Thinking Steps** | Trigger the shortcut "Find active breast cancer trials by Novartis". Capture the mid-state thinking log streaming in |
| 11 | **Trial Radar AI — Eligibility Cards** | Show the AI agent's final response with inline eligibility widgets: trial cards with green/amber/red left-border |
| 12 | **AI Agent — Drug Comparison Widget** | Show "Compare side effects of Advil and Tylenol" query with the rendered inline comparison table inside the chat thread |

---

### Video

**Suggested Demo Video Script (2–3 min screen recording):**

```
[00:00 - 00:15] — Opening
  Pan across the Dashboard hero banner
  Hover over the Pie chart to show interactive tooltips
  Hover over the Bar chart to highlight therapeutic area counts

[00:16 - 00:35] — Clinical Search
  Type "lung cancer" in keyword field
  Set Phase = Phase 3, Status = Recruiting
  Click Search → results populate
  Click eye icon on NCT06182944 (Merck Keytruda trial)
  Show full details modal: criteria, locations, sponsor

[00:36 - 00:55] — Eligibility Matcher
  Enter: Age = 55, Gender = Female, Condition = Breast Cancer
  Click "Run Eligibility Matcher"
  Expand the first ELIGIBLE result card
  Show green checkmarks for age range and condition match

[00:56 - 01:15] — OpenFDA Drug Search
  Search "Keytruda"
  Show the brand/generic info panel
  Switch to Comparator tab → enter Advil vs Tylenol
  Click Compare → show the color-coded comparison table

[01:16 - 01:35] — Company Insights
  Type "Roche" in search bar → select from dropdown
  Show the navy gradient header card
  Animate through the Area chart (2018–2026 timeline)
  Scroll to Phase distribution bar chart

[01:36 - 02:05] — Trial Radar AI Agent
  Click sidebar "Trial Radar AI"
  Click shortcut: "Find active breast cancer trials by Novartis"
  Show thinking steps streaming in real-time (3-4 steps)
  Show final trial cards rendered inline in the chat

[02:06 - 02:30] — AI Agent Eligibility
  Type: "Am I eligible for Alzheimer's trials if I am 68 years old?"
  Show reasoning steps: parsing intent, compiling profile, fetching trials, scoring
  Show the eligibility matrix widget with green/amber/red cards
  Zoom into a card's checklist of criteria reasons

[02:31 - 02:45] — Closing
  Return to Dashboard
  Final wide shot of the full layout
  Fade out
```

**Recommended Recording Tool:** Loom / OBS / QuickTime Screen Recording
**Resolution:** 1920×1080 or 1280×800
**Format:** MP4 (H.264)

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

#### Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Clinical Trial Radar                         │
│                    React 19 + Vite 8 SPA                        │
├─────────────────────────────────────────────────────────────────┤
│  Views Layer                                                     │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │Dashboard │ │TrialSrch │ │ Eligibility │ │ OpenFDA Drugs   │  │
│  └──────────┘ └──────────┘ └────────────┘ └─────────────────┘  │
│  ┌──────────────────┐  ┌───────────────────────────────────────┐│
│  │ CompanyInsights  │  │   Trial Radar AI Agent Panel          ││
│  └──────────────────┘  └───────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Services Layer                                                  │
│  ┌────────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │   apiService.js    │  │  agentEngine.js  │  │ mockData.js │ │
│  │ ClinicalTrials V2  │  │  NLP Intent      │  │ 10 trials   │ │
│  │ OpenFDA Label API  │  │  Eligibility     │  │ 5 drugs     │ │
│  │ Auto mock fallback │  │  Reasoning steps │  │ 6 companies │ │
│  └────────────────────┘  └──────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Data Sources (Public APIs — No API Key Required)               │
│  ● ClinicalTrials.gov V2  →  /api/v2/studies                   │
│  ● OpenFDA Drug Labels    →  /drug/label.json                   │
└─────────────────────────────────────────────────────────────────┘
```

**Tech Stack:**

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 8 |
| Charts | Recharts (interactive SVG) |
| Icons | Lucide React |
| Styling | Vanilla CSS with design token system |
| Data Source 1 | ClinicalTrials.gov V2 REST API (public) |
| Data Source 2 | OpenFDA Drug Label REST API (public) |
| Fallback | High-fidelity curated mock dataset |
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

#### What Makes This Stand Out

1. **Zero setup required** — both APIs are fully public with no keys or registration. Clone and run `npm install && npm run dev`.
2. **Graceful degradation** — if APIs are slow or rate-limited, the app seamlessly falls back to rich mock data with no blank states.
3. **Agentic without LLMs** — the AI agent delivers the feeling of intelligent, multi-step reasoning using a structured intent engine and streaming step-by-step logs — no expensive API calls, no rate limits, fully deterministic.
4. **Eligibility matching that works** — the criteria parser handles real-world complexity: age unit normalization (years/months/weeks), gender restrictions, free-text exclusion conflict detection.
5. **Company-level analytics** — type-ahead company search with 3 linked interactive charts gives a genuine pharma competitive intelligence feel.

---

### Project Links

| Resource | URL / Reference |
|----------|----------------|
| **Live App** | `http://localhost:5173/` (run locally with `npm run dev`) |
| **GitHub Repository** | https://github.com/saurabhdas2/ClinicalTrialRadar |
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

No environment variables, no API keys, no additional configuration needed.

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
