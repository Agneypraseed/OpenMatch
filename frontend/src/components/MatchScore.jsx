/**
 * Animated circular score ring with color-coded percentage.
 * Red (<40%), Amber (40-70%), Emerald (>70%).
 */
export default function MatchScore({ score, verdict }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s) => {
    if (s >= 70) return 'var(--accent-emerald)';
    if (s >= 40) return 'var(--accent-amber)';
    return 'var(--accent-rose)';
  };

  const getLabel = (s) => {
    if (s >= 80) return 'Excellent Match';
    if (s >= 70) return 'Strong Match';
    if (s >= 50) return 'Moderate Match';
    if (s >= 40) return 'Needs Work';
    return 'Significant Gaps';
  };

  return (
    <div className="score-ring animate-fade-in-up">
      <div className="score-ring__wrapper">
        <svg className="score-ring__svg" viewBox="0 0 180 180">
          <circle
            className="score-ring__bg"
            cx="90"
            cy="90"
            r={radius}
          />
          <circle
            className="score-ring__fill"
            cx="90"
            cy="90"
            r={radius}
            stroke={getColor(score)}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="score-ring__value" style={{ color: getColor(score) }}>
          {Math.round(score)}%
        </span>
      </div>
      <span className="score-ring__label">{getLabel(score)}</span>
      {verdict && (
        <p style={{
          maxWidth: 500,
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          lineHeight: 1.7,
        }}>
          {verdict}
        </p>
      )}
    </div>
  );
}
