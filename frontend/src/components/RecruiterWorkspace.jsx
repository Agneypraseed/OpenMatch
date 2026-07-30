import { useRef, useState } from 'react';
import JobDescInput from './JobDescInput';
import { analyzeRecruiterBatch, sendFeedbackEmail } from '../services/api';

const MAX_FILES = 50;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createEmailDrafts(result) {
  return Object.fromEntries(result.candidates.map((candidate) => [
    candidate.rank,
    {
      recipient: candidate.email || '',
      subject: candidate.feedback_email.subject,
      body: candidate.feedback_email.body,
      approved: false,
      status: 'idle',
      message: '',
    },
  ]));
}

function CandidateCard({
  candidate,
  delivery,
  draft,
  copied,
  onDraftChange,
  onCopy,
  onSend,
}) {
  const hasValidDraft = draft
    && EMAIL_PATTERN.test(draft.recipient)
    && draft.subject.trim().length >= 3
    && draft.body.trim().length >= 20;
  const isSent = draft?.status === 'sent';
  const canSend = delivery.configured
    && draft?.approved
    && hasValidDraft
    && draft.status !== 'sending'
    && !isSent;

  return (
    <article className="candidate-card">
      <div className="candidate-card__summary">
        <span className="candidate-card__rank">#{candidate.rank}</span>
        <div className="candidate-card__identity">
          <h3>{candidate.candidate_name}</h3>
          <p>{candidate.filename}{candidate.email ? ` · ${candidate.email}` : ''}</p>
        </div>
        <span className={`decision-badge decision-badge--${candidate.decision}`}>
          {candidate.decision === 'shortlisted' ? 'Shortlisted' : 'Not shortlisted'}
        </span>
        <strong className="candidate-card__score">{Math.round(candidate.score)}%</strong>
      </div>

      <p className="candidate-card__reason">{candidate.decision_reason}</p>

      <div className="candidate-card__columns">
        <div>
          <h4>Evidence found</h4>
          {candidate.evidence.length ? candidate.evidence.slice(0, 4).map((item) => (
            <div className="evidence-row" key={item.requirement}>
              <span>✓</span>
              <p><strong>{item.requirement}</strong>{item.resume_evidence}</p>
            </div>
          )) : <p className="empty-note">No explicit requirement evidence was detected.</p>}
        </div>
        <div>
          <h4>Gaps to explain</h4>
          {candidate.gaps.length ? candidate.gaps.slice(0, 4).map((item) => (
            <div className="evidence-row evidence-row--gap" key={item.requirement}>
              <span>—</span>
              <p><strong>{item.requirement}</strong>{item.reason}</p>
            </div>
          )) : <p className="empty-note">No catalogue gaps were detected.</p>}
        </div>
      </div>

      <details className="feedback-draft">
        <summary>
          <span>{isSent ? 'Feedback email sent' : 'Review feedback email'}</span>
          <small>{isSent ? draft.message : 'Human review required · never sent automatically'}</small>
        </summary>
        <div className="feedback-draft__content">
          <label>
            Recipient
            <input
              type="email"
              value={draft?.recipient || ''}
              placeholder="candidate@example.com"
              disabled={isSent}
              onChange={(event) => onDraftChange('recipient', event.target.value)}
            />
          </label>
          <label>
            Subject
            <input
              value={draft?.subject || ''}
              disabled={isSent}
              onChange={(event) => onDraftChange('subject', event.target.value)}
            />
          </label>
          <label>
            Message
            <textarea
              value={draft?.body || ''}
              disabled={isSent}
              onChange={(event) => onDraftChange('body', event.target.value)}
            />
          </label>

          {!isSent && (
            <label className="feedback-approval">
              <input
                type="checkbox"
                checked={draft?.approved || false}
                disabled={!delivery.configured}
                onChange={(event) => onDraftChange('approved', event.target.checked)}
              />
              <span>
                I reviewed this recipient and message and approve sending this
                individual email.
              </span>
            </label>
          )}

          <div className="feedback-actions">
            <button type="button" className="btn btn--secondary" onClick={onCopy}>
              {copied ? 'Copied' : 'Copy draft'}
            </button>
            {!isSent && (
              <button
                type="button"
                className="btn btn--primary"
                disabled={!canSend}
                onClick={onSend}
              >
                {draft?.status === 'sending'
                  ? 'Sending…'
                  : delivery.configured
                    ? 'Send reviewed email'
                    : 'Sending unavailable'}
              </button>
            )}
          </div>

          {draft?.status === 'error' && (
            <p className="feedback-status feedback-status--error" role="alert">{draft.message}</p>
          )}
          {isSent && (
            <p className="feedback-status feedback-status--sent" role="status">
              Delivery was accepted by the configured mail provider. This message
              cannot be sent again from this result card.
            </p>
          )}
          {!delivery.configured && (
            <p className="feedback-status">
              Sending is disabled on this server. The reviewed draft can still be copied.
            </p>
          )}
        </div>
      </details>
    </article>
  );
}

export default function RecruiterWorkspace() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [jobDesc, setJobDesc] = useState('');
  const [shortlistCount, setShortlistCount] = useState(3);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [copiedRank, setCopiedRank] = useState(null);
  const [emailDrafts, setEmailDrafts] = useState({});

  const addFiles = (selectedFiles) => {
    const candidates = Array.from(selectedFiles);
    const pdfs = candidates.filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    ).filter((file) => file.size <= 10 * 1024 * 1024);
    if (pdfs.length !== candidates.length) {
      setError('Only PDF resumes up to 10 MB can be added.');
    } else {
      setError('');
    }
    setFiles((current) => {
      const names = new Set(current.map((file) => `${file.name}-${file.size}`));
      const unique = pdfs.filter((file) => !names.has(`${file.name}-${file.size}`));
      return [...current, ...unique].slice(0, MAX_FILES);
    });
  };

  const removeFile = (index) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const canAnalyze = files.length > 0 && jobDesc.trim().length > 50 && status !== 'loading';
  const effectiveShortlist = Math.min(Math.max(1, shortlistCount), Math.max(files.length, 1));

  const submit = async () => {
    if (!canAnalyze) return;
    setStatus('loading');
    setError('');
    setResults(null);
    try {
      const result = await analyzeRecruiterBatch(files, jobDesc, effectiveShortlist);
      setResults(result);
      setEmailDrafts(createEmailDrafts(result));
      setStatus('done');
    } catch (err) {
      setError(err.message || 'The candidate comparison failed.');
      setStatus('error');
    }
  };

  const copyFeedback = async (candidate) => {
    const draft = emailDrafts[candidate.rank];
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopiedRank(candidate.rank);
  };

  const updateEmailDraft = (rank, field, value) => {
    setEmailDrafts((current) => ({
      ...current,
      [rank]: {
        ...current[rank],
        [field]: value,
        status: current[rank].status === 'sent' ? 'sent' : 'idle',
        message: '',
      },
    }));
  };

  const sendFeedback = async (candidate) => {
    const draft = emailDrafts[candidate.rank];
    if (!draft || !draft.approved || !results.email_delivery.configured) return;

    setEmailDrafts((current) => ({
      ...current,
      [candidate.rank]: {
        ...current[candidate.rank],
        status: 'sending',
        message: '',
      },
    }));

    try {
      const delivery = await sendFeedbackEmail(draft);
      setEmailDrafts((current) => ({
        ...current,
        [candidate.rank]: {
          ...current[candidate.rank],
          status: 'sent',
          message: `Sent ${new Date(delivery.sent_at).toLocaleString()}`,
        },
      }));
    } catch (err) {
      setEmailDrafts((current) => ({
        ...current,
        [candidate.rank]: {
          ...current[candidate.rank],
          status: 'error',
          message: err.message || 'The email could not be sent.',
        },
      }));
    }
  };

  if (results) {
    return (
      <section className="recruiter-results animate-fade-in-up">
        <div className="results__header">
          <div>
            <span className="eyebrow">Recruiter review</span>
            <h2 className="results__title">{results.job_title}</h2>
            <p>{results.analyzed_count} candidates compared · {results.shortlist_count} shortlisted</p>
          </div>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => {
              setResults(null);
              setEmailDrafts({});
            }}
          >
            New comparison
          </button>
        </div>

        <div className="methodology-card">
          <div>
            <strong>Evidence confidence: {results.methodology.confidence}</strong>
            <p>{results.methodology.statement}</p>
          </div>
          <span>{results.methodology.skills_analyzed} requirements detected</span>
        </div>

        <div className={`email-capability ${results.email_delivery.configured ? 'email-capability--ready' : ''}`}>
          <div>
            <strong>
              {results.email_delivery.configured
                ? 'Individual email delivery is available'
                : 'Feedback drafts are ready'}
            </strong>
            <p>{results.email_delivery.statement}</p>
          </div>
          <span>{results.email_delivery.configured ? 'SMTP connected' : 'Copy drafts or configure SMTP'}</span>
        </div>

        <div className="candidate-list">
          {results.candidates.map((candidate) => (
            <CandidateCard
              key={`${candidate.rank}-${candidate.filename}`}
              candidate={candidate}
              delivery={results.email_delivery}
              draft={emailDrafts[candidate.rank]}
              copied={copiedRank === candidate.rank}
              onDraftChange={(field, value) => updateEmailDraft(candidate.rank, field, value)}
              onCopy={() => copyFeedback(candidate)}
              onSend={() => sendFeedback(candidate)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="workspace-card animate-fade-in-up">
      <div className="workspace-card__header">
        <div>
          <span className="eyebrow">Recruiter comparison</span>
          <h2>Compare candidates against one role</h2>
        </div>
        <span className="workspace-card__privacy">
          <span aria-hidden="true" /> Python · Local engine
        </span>
      </div>

      <div className="input-panel">
        <div className="input-step">
          <div className="input-step__heading">
            <span>01</span>
            <div>
              <h3>Candidate resumes</h3>
              <p>Upload up to {MAX_FILES} text-based PDFs.</p>
            </div>
          </div>
          <button type="button" className="multi-upload" onClick={() => inputRef.current?.click()}>
            <span aria-hidden="true">+</span>
            <strong>Add candidate resumes</strong>
            <small>PDF · 10 MB per file</small>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="visually-hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          <div className="file-queue" aria-live="polite">
            {files.map((file, index) => (
              <div className="file-queue__item" key={`${file.name}-${file.size}`}>
                <span>{index + 1}</span>
                <p>{file.name}<small>{(file.size / 1024 / 1024).toFixed(1)} MB</small></p>
                <button type="button" onClick={() => removeFile(index)} aria-label={`Remove ${file.name}`}>×</button>
              </div>
            ))}
            {!files.length && <p className="empty-note">No resumes added yet.</p>}
          </div>
        </div>

        <div className="input-step">
          <div className="input-step__heading">
            <span>02</span>
            <div>
              <h3>Role criteria</h3>
              <p>Paste the description or import a public job link.</p>
            </div>
          </div>
          <JobDescInput value={jobDesc} onChange={setJobDesc} />
        </div>
      </div>

      <div className="analyze-section recruiter-controls">
        <label>
          Shortlist
          <input
            type="number"
            min="1"
            max={Math.max(files.length, 1)}
            value={effectiveShortlist}
            onChange={(event) => setShortlistCount(Number(event.target.value))}
          />
          of {files.length || 0}
        </label>
        <div className="analyze-section__status">
          <span className={files.length ? 'is-complete' : ''}>{files.length || 0} resumes</span>
          <span className={jobDesc.trim().length > 50 ? 'is-complete' : ''}>Role criteria</span>
        </div>
        <button type="button" className="btn btn--primary btn--large" onClick={submit} disabled={!canAnalyze}>
          {status === 'loading' ? 'Comparing candidates…' : 'Compare candidates'}
          {status !== 'loading' && <span className="btn__arrow" aria-hidden="true">→</span>}
        </button>
      </div>
      {error && <div className="error-banner" role="alert"><div><strong>Comparison failed</strong><p>{error}</p></div></div>}
    </section>
  );
}
