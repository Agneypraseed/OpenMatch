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

