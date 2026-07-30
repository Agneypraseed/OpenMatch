/**
 * Visual skill gap chart — shows matching, partial, and missing skills
 * with icons and evidence text.
 */
export default function SkillGapChart({ matchingSkills, missingSkills }) {
  const allSkills = [
    ...(matchingSkills || []).map((s) => ({ ...s, group: 'match' })),
    ...(missingSkills || []).map((s) => ({ ...s, group: 'missing' })),
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'strong_match': return '✓';
      case 'partial_match': return '≈';
      case 'missing': return '—';
      default: return '·';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical': return 'badge badge--danger';
      case 'important': return 'badge badge--warning';
      default: return 'badge badge--info';
    }
  };

  // Group by status
  const strong = allSkills.filter((s) => s.status === 'strong_match');
  const partial = allSkills.filter((s) => s.status === 'partial_match');
  const missing = allSkills.filter((s) => s.status === 'missing');

  const renderGroup = (title, skills, icon) => {
    if (!skills.length) return null;
    return (
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <span className="section-header__icon">{icon}</span>
          <h3 className="section-header__title">{title}</h3>
          <span className="section-header__count">{skills.length} skills</span>
        </div>
        <div className="skill-grid stagger-children">
          {skills.map((skill, i) => (
            <div key={`${skill.skill}-${i}`} className="skill-item">
              <span className="skill-item__icon">{getStatusIcon(skill.status)}</span>
              <div className="skill-item__info">
                <div className="skill-item__name">{skill.skill}</div>
                <div className="skill-item__evidence">{skill.evidence}</div>
              </div>
              <span className={getPriorityBadge(skill.priority)}>
                {skill.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up">
      {renderGroup('Strong matches', strong, '01')}
      {renderGroup('Transferable skills', partial, '02')}
      {renderGroup('Gaps to address', missing, '03')}
    </div>
  );
}
