# OpenMatch

OpenMatch compares resumes against a job description and shows the evidence behind the match instead of returning a black-box score.

It supports two workflows:

- **Applicant:** analyze one resume, review matched and missing requirements, improve resume wording, and prepare for interviews.
- **Recruiter:** compare multiple resumes against the same role, rank candidates using the same criteria, and review feedback drafts before sending anything.

The backend can run entirely in local deterministic mode. OpenAI and Gemini are optional.

## Stack

- React + Vite
- FastAPI
- Pydantic
- LangChain + FAISS for optional RAG analysis
- `pypdf` for resume text extraction

## Run locally

Clone the repository, then start the backend and frontend in separate terminals.

### Backend

```bash
cd backend
python -m venv .venv
```

Activate the environment:

```bash
# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS/Linux
source .venv/bin/activate
```

Install dependencies and start the API:

```bash
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API: `http://127.0.0.1:8000`  
Docs: `http://127.0.0.1:8000/docs`

No API key is required for local analysis. For OpenAI, Gemini, or SMTP configuration, copy `backend/.env.example` to `backend/.env` and fill in the values you need.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

The **Explore sample** flow can be used without the backend or an API key.

## Checks

Backend tests:

```bash
cd backend
python -m unittest discover -s tests
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Notes

- Job descriptions can be pasted directly or extracted from supported public job pages.
- Recruiter email delivery is disabled by default and requires explicit review before sending.
- AI providers return the same application response shape as local analysis.

Implementation details, provider behavior, ingestion safeguards, and production work are documented in [PRODUCT.md](./PRODUCT.md).
