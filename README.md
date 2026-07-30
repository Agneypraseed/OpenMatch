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

The UI supports light and dark themes. Uploaded PDFs are processed in memory by
the MVP and are not intentionally persisted.

## How analysis works

The Analysis engine control applies to each applicant request:

- `Local Python` — deterministic zero-key evidence matching;
- `OpenAI` — GPT-5.6 with OpenAI embeddings and the existing FAISS RAG flow; or
- `Google Gemini` — Gemini structured analysis and embeddings with the same RAG
  flow.

The UI starts in Local mode. API keys entered in the UI remain in React memory,
are included only in the next `/api/analyze` request, and are not written to
local storage, environment files, logs, or the backend.
Production deployments must use HTTPS before accepting request-scoped keys.

For server-managed keys, `ANALYSIS_MODE` still controls requests that omit an
explicit provider:

- `auto` (default) — use Gemini when `GOOGLE_API_KEY` exists, otherwise OpenAI
  when `OPENAI_API_KEY` exists, otherwise use the local analyzer.
- `local` — always use deterministic, zero-key evidence matching.
- `ai` — require either configured AI provider.

The recruiter comparison deliberately uses the same local analyzer for every
candidate. This makes one batch consistent, fast, inexpensive, and easier to
audit.

The default local path:

1. extracts text from the PDF with `pypdf`;
2. identifies normalized requirements in the job description;
3. finds direct supporting evidence in the resume;
4. derives the score from matched requirements;
5. returns the matched evidence, missing requirements, and specific next steps.

The optional AI paths use LangChain structured output and a FAISS vector index.
OpenAI requests use the Responses API with `gpt-5.6-sol` as the default chat
model and `text-embedding-3-small` for retrieval. Gemini defaults to
`gemini-2.5-flash`. RAG retrieves relevant passages from the supplied resume and
job description; it does **not** browse job sites.

## Job links

Both workspaces can import a public job-posting URL. The backend performs a
guarded server-side web request, blocks private/internal addresses and oversized
responses, and prefers Schema.org `JobPosting` data when available. Imported
text is always shown in an editable field for review before analysis.

Public LinkedIn pages may work when they expose structured job data. Pages that
require sign-in or block automated access must be pasted manually or connected
through an approved LinkedIn partner integration.

## Feedback emails

Recruiter results include a feedback email draft for every candidate, including
people who are not shortlisted. Nothing is sent automatically.

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

See [PRODUCT.md](PRODUCT.md) for the product boundaries and production backlog.

## Stack

- React 19 + Vite
- FastAPI + Pydantic
- `pypdf` for resume text extraction
- Optional: LangChain, FAISS, OpenAI, Google Gemini

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

## API

- `POST /api/analyze` — applicant analysis
- `POST /api/jobs/extract` — guarded public job-page import
- `POST /api/recruiter/analyze` — batch comparison and feedback drafts
- `GET /api/recruiter/feedback/capabilities` — delivery readiness
- `POST /api/recruiter/feedback/send` — send one explicitly approved draft
- `GET /health` — backend health check

## Verification

```powershell
cd backend
.\venv\Scripts\python.exe -m unittest discover -s tests -v

cd ..\frontend
npm.cmd run lint
npm.cmd run build
```
