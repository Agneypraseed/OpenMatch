# OpenMatch

An evidence-based recruitment platform that helps applicants improve their job fit and helps recruiters shortlist candidates transparently while providing meaningful feedback to every applicant.

The application has two workspaces:

- **Applicant** — compare one resume with one role and get a match report,
  resume improvements, and interview preparation.
- **Recruiter** — compare up to 50 resumes against the same role, choose the
  shortlist size, review ranked evidence and gaps for every candidate, and
  review, edit, copy, or send individual feedback emails.

The Applicant workspace includes a compact **Analysis engine** control where a
user can choose Local Python, OpenAI, or Google Gemini and select a supported
model without leaving the report flow.

## Why this is an SDE portfolio project

OpenMatch is designed to demonstrate more than an LLM wrapper. It has a typed
FastAPI boundary, a deterministic offline analysis path, provider-neutral AI
adapters, retrieval-augmented evidence, defensive public-URL ingestion, and a
human-in-the-loop recruiter workflow. The same response contract powers every
analysis mode.

The fastest demo path is **Applicant → Explore sample**. It requires no backend,
PDF, or API key and opens a complete fictional report with:

- weighted, inspectable score evidence;
- truthful resume edits;
- role-specific interview questions;
- editable STAR stories with speaking-time feedback and clipboard export; and
- JSON report export for debugging or downstream integrations.

### Architecture

```text
React workspace
  ├─ local sample (zero setup)
  └─ FastAPI /api/analyze
       ├─ deterministic Python matcher
       └─ provider-neutral AI pipeline
            job parser → CV parser → in-memory FAISS retrieval
                       → gap analyst → resume + interview coaches

All paths → shared evidence-shaped response → applicant/recruiter UI
```

Important engineering choices:

- **Deterministic fallback:** the product stays usable without API credentials,
  and its weighted scoring can be unit tested exactly.
- **One response shape:** local, OpenAI, and Gemini modes do not leak
  provider-specific objects into the frontend.
- **Evidence boundary:** suggestions quote or reference resume evidence and
  explicitly avoid inventing skills, metrics, or interview outcomes.
- **Safe ingestion:** job URLs are checked against private/reserved networks,
  redirects and response sizes are bounded, and pasted text remains the fallback.
- **Human review:** recruiter feedback is editable, approval-gated, and never
  bulk-sent automatically.

## Interview-ready STAR narrative

Use this as a starting point and replace the Result numbers with your own measured
demo or test outcomes.

- **Situation:** Applicants receive opaque ATS scores, while recruiters struggle
  to explain role-specific decisions consistently. Existing AI prototypes also
  fail completely when an API key or provider is unavailable.
- **Task:** Build a full-stack application that compares resumes with one shared
  role rubric, grounds every recommendation in evidence, and remains demoable and
  testable offline.
- **Action:** Designed a React/FastAPI system with Pydantic contracts, a
  deterministic weighted matcher, provider-neutral OpenAI/Gemini adapters, an
  in-memory RAG pipeline, SSRF-aware job-page extraction, approval-gated email,
  and a reusable STAR coaching workflow. Added a zero-setup sample report so an
  interviewer can reach the most important states in one click.
- **Result:** Delivered applicant and recruiter workflows behind one explainable
  analysis model, with automated backend coverage for local matching, providers,
  URL safety, ranking, and email approval. Measure and add your own build time,
  test count, analysis latency, or usability result before presenting this claim.

### Two-minute demo script

1. Click **Explore sample** and explain why a zero-dependency demo path matters.
2. Open **How this score was calculated** and show weighted evidence rather than
   an unexplained AI score.
3. Compare a strong match with a transferable skill in **Skill gaps**.
4. Open **STAR coach**, edit one field, and copy the answer.
5. Close with the deterministic fallback, shared response schema, safety
   boundaries, and the production-hardening list below.

## How analysis works

The Analysis engine control applies to each applicant request:

- `Local` — deterministic zero-key evidence matching;
- `OpenAI` — OpenAI embeddings and the existing FAISS RAG flow; or
- `Google Gemini` — Gemini structured analysis and embeddings with the same RAG
  flow.


## Feedback emails

Recruiter results include a feedback email draft for every candidate
Email delivery is disabled until it is explicitly enabled and SMTP is
configured. Once configured, the recruiter must open one candidate's draft,
verify or enter the recipient, review the editable subject and body, and check
the approval box before the send button is enabled. There is no bulk or
automatic rejection send.

Configure these values in `backend/.env` and restart the API:

```dotenv
EMAIL_DELIVERY_ENABLED=true
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password
SMTP_FROM_EMAIL=hiring@example.com
SMTP_FROM_NAME=Your hiring team
SMTP_SECURITY=starttls
```

`SMTP_SECURITY` accepts `starttls`, `ssl`, or `plain`. A production deployment
must not enable this development delivery route until recruiter authentication
and authorization are in place. It also needs a verified sending domain,
delivery/bounce tracking, audit logs, and appropriate privacy/retention controls.

## Local development

### Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The API is available at `http://127.0.0.1:8000`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.
