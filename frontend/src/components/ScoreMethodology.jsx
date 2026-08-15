const WEIGHTS = { critical: 3, important: 2, nice_to_have: 1 };
const CREDIT = { strong_match: 1, partial_match: 0.5, missing: 0 };

export default function ScoreMethodology({ matchingSkills = [], missingSkills = [] }) {
  const skills = [...matchingSkills, ...missingSkills];
  const earned = skills.reduce(
    (sum, skill) => sum + (WEIGHTS[skill.priority] || 1) * (CREDIT[skill.status] || 0),
    0,
  );
  const possible = skills.reduce(
    (sum, skill) => sum + (WEIGHTS[skill.priority] || 1),
    0,
  );

  const rows = [
    ['Required', '3×', skills.filter((item) => item.priority === 'critical').length],
    ['Preferred', '2×', skills.filter((item) => item.priority === 'important').length],
    ['Nice to have', '1×', skills.filter((item) => item.priority === 'nice_to_have').length],
  ];

  return (
    <details className="methodology-disclosure">
      <summary>
        <span>
          <strong>How this score was calculated</strong>
          <small>Transparent weighted evidence matching</small>
        </span>
        <span className="methodology-disclosure__equation">
          {earned.toFixed(1)} / {possible || 0} points
        </span>
      </summary>
      <div className="methodology-disclosure__body">
        <p>
          Strong evidence receives full credit, related experience receives half credit,
          and unsupported requirements receive none. The score supports review; it does
          not make a hiring decision.
        </p>
        <div className="methodology-table" role="table" aria-label="Score weights">
          {rows.map(([label, weight, count]) => (
            <div key={label} role="row">
              <span role="cell">{label}</span>
              <strong role="cell">{weight}</strong>
              <small role="cell">{count} detected</small>
            </div>
          ))}
        </div>
      </div>
    </details>
  );
}
