## User mode

### Applicant

An applicant uploads one resume and provides a job description as pasted text or
a public job-page URL. Matchline returns:

- a weighted match score;
- the resume evidence behind each matched requirement;
- missing or partially supported requirements;
- truthful resume-improvement suggestions; and
- role-specific interview preparation.

### Recruiter

A recruiter uploads multiple resumes and provides one shared job description.
Matchline:

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

The default `ANALYSIS_MODE=auto` behavior is:

1. If `GOOGLE_API_KEY` is absent, use the deterministic Python analyzer.
2. If the key exists, use the Gemini/LangChain/RAG pipeline.
3. If the AI service fails while mode is `auto`, fall back to the local analyzer.

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

The repository contains a five-stage Gemini/LangChain pipeline:

1. job parser;
2. CV analyzer;
3. FAISS retrieval over resume chunks;
4. gap analyst;
5. resume and interview preparation.

RAG retrieves relevant evidence from already-ingested documents. It does not
download web pages and it should not be confused with job-link extraction.
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
Solutions partners. Matchline therefore attempts only structured public page
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
