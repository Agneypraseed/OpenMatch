import { useState } from 'react';

/**
 * Interview preparation view with expandable Q&A accordion cards.
 * Questions are categorized as behavioral, technical, or situational.
 */
export default function InterviewPrep({ preparation }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!preparation) return null;

  const {
    role_summary,
    questions,
    general_tips,
    topics_to_study,
  } = preparation;

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'behavioral': return 'badge badge--info';
      case 'technical': return 'badge badge--warning';
      case 'situational': return 'badge badge--success';
      default: return 'badge badge--info';
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Role Summary */}
      <div style={{ marginBottom: 32 }}>
        <div className="section-header">
          <span className="section-header__icon">01</span>
          <h3 className="section-header__title">What to Expect</h3>
        </div>
        <div className="card" style={{
          borderLeft: '3px solid var(--accent-purple)',
          color: 'var(--text-secondary)',
          fontSize: '0.95rem',
          lineHeight: 1.8,
        }}>
          {role_summary}
        </div>
      </div>

      {/* Questions */}
      {questions?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <span className="section-header__icon">02</span>
            <h3 className="section-header__title">Likely Interview Questions</h3>
            <span className="section-header__count">{questions.length} questions</span>
          </div>
          <div className="stagger-children">
            {questions.map((q, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={i}
                  className={`interview-card ${isOpen ? 'interview-card--open' : ''}`}
                >
                  <button
                    type="button"
                    className="interview-card__header"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className={getCategoryBadge(q.category)}>
                      {q.category}
                    </span>
                    <span className="interview-card__question">{q.question}</span>
                    <span className="interview-card__chevron">▼</span>
                  </button>
                  {isOpen && (
                    <div className="interview-card__body">
                      <p className="interview-card__why">
                        Why they ask: {q.why_asked}
                      </p>
                      <p className="interview-card__answer">{q.suggested_answer}</p>
                      {q.tips?.length > 0 && (
                        <div className="interview-card__tips">
                          {q.tips.map((tip, j) => (
                            <p key={j} className="interview-card__tip">
                              {tip}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Topics to Study */}
      {topics_to_study?.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-header">
            <span className="section-header__icon">03</span>
            <h3 className="section-header__title">Topics to Review</h3>
          </div>
          <div className="skill-grid stagger-children">
            {topics_to_study.map((topic, i) => (
              <div key={i} className="skill-item">
                <span className="skill-item__icon">→</span>
                <div className="skill-item__info">
                  <div className="skill-item__name">{topic}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Tips */}
      {general_tips?.length > 0 && (
        <div>
          <div className="section-header">
            <span className="section-header__icon">04</span>
            <h3 className="section-header__title">General Interview Tips</h3>
          </div>
          <div className="card stagger-children">
            {general_tips.map((tip, i) => (
              <p key={i} style={{
                padding: '8px 0',
                borderBottom: i < general_tips.length - 1
                  ? '1px solid var(--border-subtle)' : 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
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
