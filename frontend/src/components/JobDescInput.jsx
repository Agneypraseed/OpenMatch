/**
 * Job description textarea input component.
 */
export default function JobDescInput({ value, onChange }) {
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
      <textarea
        id="job-description-input"
        className="jd-input__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste the full role description, including responsibilities and requirements…"
        spellCheck={false}
      />
    </div>
  );
}
