/**
 * Resume optimization view showing before/after improvements,
 * keyword suggestions, and a tailored professional summary.
 */
export default function ResumeOptimizer({ optimization }) {
  if (!optimization) return null;

  const {
    tailored_summary,
    bullet_improvements,
    keyword_suggestions,
    new_bullet_points,
    formatting_tips,
  } = optimization;

  return (
    <div className="animate-fade-in-up">
      {/* Tailored Summary */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <span className="section-header__icon">01</span>
          <h3 className="section-header__title">Tailored Professional Summary</h3>
        </div>
        <div className="card" style={{
          borderLeft: '3px solid var(--accent-blue)',
          fontSize: '0.95rem',
          lineHeight: 1.8,
          color: 'var(--text-primary)',
        }}>
          {tailored_summary}
        </div>
      </div>

      {/* Bullet Point Improvements */}
      {bullet_improvements?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <span className="section-header__icon">02</span>
            <h3 className="section-header__title">Bullet Point Improvements</h3>
            <span className="section-header__count">
              {bullet_improvements.length} suggestions
            </span>
          </div>
          <div className="stagger-children">
            {bullet_improvements.map((item, i) => (
              <div key={i} className="optimization-card">
                <div className="optimization-card__label optimization-card__label--original">
                  Original
                </div>
                <p className="optimization-card__text">{item.original}</p>

                <div className="optimization-card__divider" />

                <div className="optimization-card__label optimization-card__label--improved">
                  Improved
                </div>
                <p className="optimization-card__text optimization-card__text--improved">
                  {item.improved}
                </p>

                <div className="optimization-card__rationale">
                  {item.rationale}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword Suggestions */}
      {keyword_suggestions?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <span className="section-header__icon">03</span>
            <h3 className="section-header__title">ATS Keywords to Add</h3>
          </div>
          <div className="keyword-tags">
            {keyword_suggestions.map((kw, i) => (
              <span key={i} className="keyword-tag" title={kw.context}>
                {kw.keyword}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 16 }} className="stagger-children">
            {keyword_suggestions.map((kw, i) => (
              <div key={i} className="skill-item" style={{ marginBottom: 8 }}>
                <span className="skill-item__icon">+</span>
                <div className="skill-item__info">
                  <div className="skill-item__name">{kw.keyword}</div>
                  <div className="skill-item__evidence">
                    Add to: {kw.where_to_add} — {kw.context}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Bullet Points */}
      {new_bullet_points?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <span className="section-header__icon">04</span>
            <h3 className="section-header__title">New Bullet Points to Add</h3>
          </div>
          <div className="card stagger-children">
            {new_bullet_points.map((bullet, i) => (
              <p key={i} style={{
                padding: '8px 0',
                borderBottom: i < new_bullet_points.length - 1
                  ? '1px solid var(--border-subtle)' : 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
              }}>
                • {bullet}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Formatting Tips */}
      {formatting_tips?.length > 0 && (
        <div>
          <div className="section-header">
            <span className="section-header__icon">05</span>
            <h3 className="section-header__title">Formatting Tips</h3>
          </div>
          <div className="card stagger-children">
            {formatting_tips.map((tip, i) => (
              <p key={i} style={{
                padding: '6px 0',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}>
                {i + 1}. {tip}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
