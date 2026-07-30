import { useState } from 'react';
import { extractJobDescription } from '../services/api';

/**
 * Job description textarea input component.
 */
export default function JobDescInput({ value, onChange }) {
  const [sourceMode, setSourceMode] = useState('text');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [sourceNote, setSourceNote] = useState('');

  const importFromUrl = async () => {
    if (!url.trim()) return;
    setStatus('loading');
    setError('');
    setSourceNote('');
    try {
      const result = await extractJobDescription(url.trim());
      onChange(result.job_description);
      setSourceNote(
        `${result.title || 'Job description'}${result.company ? ` · ${result.company}` : ''}`
      );
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Could not import this job page.');
      setStatus('error');
    }
  };

  return (
    <div className="jd-input">
      <div className="jd-input__meta">
        <label className="jd-input__label" htmlFor="job-description-input">
          Job description
        </label>
        <span className={`jd-input__count ${value.length >= 50 ? 'jd-input__count--valid' : ''}`}>
          {value.length.toLocaleString()} characters
        </span>
      </div>
      <div className="source-switcher" role="group" aria-label="Job description source">
        <button
          type="button"
          className={sourceMode === 'text' ? 'is-active' : ''}
          onClick={() => setSourceMode('text')}
          aria-pressed={sourceMode === 'text'}
        >
          Paste text
        </button>
        <button
          type="button"
          className={sourceMode === 'url' ? 'is-active' : ''}
          onClick={() => setSourceMode('url')}
          aria-pressed={sourceMode === 'url'}
        >
          Import link
        </button>
      </div>
      {sourceMode === 'url' && (
        <div className="url-import">
          <div className="url-import__row">
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://company.com/jobs/role"
              aria-label="Public job posting URL"
            />
            <button
              type="button"
              onClick={importFromUrl}
              disabled={!url.trim() || status === 'loading'}
            >
              {status === 'loading' ? 'Importing…' : 'Import'}
            </button>
          </div>
          <p className="url-import__hint">
            Works with public job pages. Sign-in-only pages may need pasted text.
          </p>
          {error && <p className="url-import__error" role="alert">{error}</p>}
          {sourceNote && <p className="url-import__success">Imported: {sourceNote}. Review below.</p>}
        </div>
      )}
      <textarea
        id="job-description-input"
        className="jd-input__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          sourceMode === 'url'
            ? 'Imported job text will appear here for review…'
            : 'Paste the full role description, including responsibilities and requirements…'
        }
        spellCheck={false}
      />
    </div>
  );
}
