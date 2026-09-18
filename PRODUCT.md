## User mode

### Applicant

An applicant uploads one resume and provides a job description as pasted text or
a public job-page URL. OpenMatch returns:

- a weighted match score;
- the resume evidence behind each matched requirement;
- missing or partially supported requirements;
- truthful resume-improvement suggestions; and
- role-specific interview preparation.

### Recruiter

A recruiter uploads multiple resumes and provides one shared job description.
OpenMatch:

- applies the same detected criteria to every resume;
- ranks candidates by supported evidence;
- lets the recruiter choose how many candidates to shortlist;
- explains each ranking and decision;
- shows evidence and gaps for every candidate; and
- prepares a feedback email draft for every candidate; and
- can deliver one reviewed draft at a time when SMTP is configured.

Email drafts require human review. The MVP never sends a rejection
automatically or enables a bulk-send shortcut.

## What analyzes documents today?

Applicant requests can explicitly select Local Python, OpenAI, or Gemini from
the compact Analysis engine control in the report workspace. The selected API
key is request-scoped and stays only in browser memory before submission.

For requests that omit an explicit provider, `ANALYSIS_MODE=auto` behaves as
follows:

1. Use Gemini when `GOOGLE_API_KEY` exists.
2. Otherwise use OpenAI when `OPENAI_API_KEY` exists.
3. Otherwise use the deterministic Python analyzer.
4. If an environment-selected AI service fails in `auto`, fall back locally.

### Local Python mode

Local mode uses:

- `pypdf` to extract resume text;
- a transparent requirements catalogue and regular expressions;
- weighted required/preferred/nice-to-have matching;
- related-skill groups for partial matches; and
- evidence-grounded templates for recommendations and feedback.

This mode is fast, private, and auditable, but it cannot understand arbitrary
language as deeply as a semantic model. The UI labels local results explicitly.

### Optional AI + RAG mode

The repository contains a provider-neutral five-stage LangChain pipeline:

1. job parser;
2. CV analyzer;
3. FAISS retrieval over resume chunks;
4. gap analyst;
5. resume and interview preparation.

RAG retrieves relevant evidence from already-ingested documents. It does not
download web pages and it should not be confused with job-link extraction.
GPT-6 Astra uses the Responses API for structured analysis and OpenAI embeddings for
the in-memory FAISS index. Gemini uses its structured chat and embedding
adapters. Both providers produce the same Pydantic response contracts.
The first recruiter batch endpoint intentionally uses the local evidence matcher
so every candidate receives the same predictable criteria without multiplying
LLM cost per resume.

## Job-page URL ingestion

`POST /api/jobs/extract` performs a separate web-ingestion step:

1. validate that the URL is public HTTP(S);
2. block loopback, private, link-local, and reserved network targets;
3. limit redirects, response size, and response time;
4. prefer Schema.org `JobPosting` JSON-LD;
5. fall back to readable public HTML text; and
6. return editable text for the user to review.

One normal web request is enough for public, server-rendered job pages. It is not
enough for pages that require authentication, block automated requests, or render
the job only after browser JavaScript runs.

LinkedIn's official Job Posting APIs are restricted to approved LinkedIn Talent
Solutions partners. OpenMatch therefore attempts only structured public page
content and otherwise asks the user to paste the description. It does not bypass
sign-in or scrape private LinkedIn content.

## Recruiter feedback and email delivery

The MVP generates review-required email drafts with:

- the evidence that supported the application;
- the most important requirements not demonstrated in the submitted resume;
- language that separates a role-specific decision from the applicant's overall
  potential; and
- a clear indication of whether anything has been sent.

The delivery endpoint is off by default, uses configured SMTP only when
`EMAIL_DELIVERY_ENABLED=true`, and requires the client to submit an explicit
`approved: true` for each recipient, subject, and body. The UI disables approval
and sending when delivery is unavailable, keeps every field editable before
sending, and prevents a duplicate send from the same result card. This opt-in is
for a trusted local MVP; an internet-facing deployment must add recruiter
authentication and authorization before enabling it.

Production hardening still needs:

1. recruiter authentication and organization membership;
2. a verified sending domain;
3. a verified production email provider and bounce/complaint webhooks;
4. explicit recruiter approval per message or approved batch;
5. delivery, bounce, complaint, and unsubscribe tracking;
6. audit logs retaining the reviewed content and decision evidence; and
7. GDPR retention/deletion controls and a lawful processing basis.

## Interview studio

The studio is an independent workspace with mixed, behavioral, or technical
sessions of 3, 5, or 8 questions. Applicants can seed a session from their report
or supply a role and focus topic directly. Each submitted answer receives notes,
one optional follow-up, wording suggestions, and basic delivery metrics.
The recap includes all submitted answers, skipped questions, and any draft left
when ending early. Notes can be downloaded as Markdown without API credentials.

`POST /api/interview/start` creates a bounded question set.
`POST /api/interview/answer` reviews an answer with bounded conversation history.
Both endpoints are stateless: OpenMatch does not persist transcripts or keys.
The browser keeps the session in memory across workspace switches, but not
reloads. API requests time out with a retryable error; a provider failure is
reported explicitly, not presented as local coaching from an AI model.

Local mode uses question templates and transparent checks for answer length,
personal actions, outcome language, possible filler phrases, and four common
grammar patterns. It does not grade correctness, relevance, employability, or
personality. AI mode uses the existing structured OpenAI/Gemini integration for
role-specific questions and feedback that references the answer. Quoted wording
corrections are discarded when the original phrase is absent from the answer.

Speech recognition and optional question read-aloud use browser APIs. Voice
input is English-only, requires browser support and microphone permission, and
may use the browser vendor's remote speech service. OpenMatch itself sends only
the submitted text to the backend (and to the selected AI provider in AI mode).
Switching workspaces stops listening. Denied permissions and unavailable speech
services leave typed input available. Reading a question stops before listening
starts. The pace estimate uses words divided by actual microphone-on time,
including pauses, and is omitted for typed or edited transcripts. The 100–180
words/min band is a practice heuristic, not an assessment standard.

This is an original integration inspired by the conversational practice,
speech transcription, pace feedback, and grammar feedback in
[Tech-Enhanced AI Interview Learning Platform](https://github.com/beingamanforever/Tech-Enhanced-AI-Interview-Learning-Platform).
No model weights or source code from that project are bundled. Browser behavior
is documented in [MDN's SpeechRecognition reference](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition).
The GPT-6 Astra default uses Responses, low reasoning effort, and structured
outputs per the
[official model documentation](https://developers.openai.com/api/docs/models/gpt-6-astra).

The interface uses a warm neutral palette, serif display typography, a compact
workspace navigation, flat panels, responsive layouts, and a separate dark theme.
Interview setup gives way to a focused conversation view. Keyboard focus, visible
labels, disabled/loading states, reduced motion, and recoverable errors support
the same flow on desktop and mobile.

## Important production work

- replace in-memory requests with encrypted object storage and a database;
- add authentication, organizations, roles, and audit logs;
- version job criteria so all candidates are compared consistently;
- add bias and adverse-impact monitoring;
- separate job-relevant evidence from protected or sensitive information;
- add reviewer overrides with recorded reasons;
- calibrate scores against real hiring outcomes without automating final decisions;
- introduce queues for large batches; and
- replace synchronous SMTP delivery with a durable, approval-gated email outbox.
