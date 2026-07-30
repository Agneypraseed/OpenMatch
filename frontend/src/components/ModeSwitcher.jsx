export default function ModeSwitcher({ value, onChange }) {
  return (
    <div className="mode-switcher" aria-label="Choose workspace" role="group">
      <button
        type="button"
        className={value === 'applicant' ? 'is-active' : ''}
        onClick={() => onChange('applicant')}
        aria-pressed={value === 'applicant'}
      >
        Applicant
      </button>
      <button
        type="button"
        className={value === 'recruiter' ? 'is-active' : ''}
        onClick={() => onChange('recruiter')}
        aria-pressed={value === 'recruiter'}
      >
        Recruiter
      </button>
    </div>
  );
}
