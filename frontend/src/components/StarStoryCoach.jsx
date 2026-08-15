import { useMemo, useState } from 'react';

const STAR_FIELDS = [
  { key: 'situation', label: 'Situation', prompt: 'Set the context and explain why it mattered.' },
  { key: 'task', label: 'Task', prompt: 'State what you personally owned.' },
  { key: 'action', label: 'Action', prompt: 'Explain your decisions, steps, and trade-offs.' },
  { key: 'result', label: 'Result', prompt: 'Close with a verified outcome and what changed.' },
];

function fallbackStories(preparation) {
  if (preparation?.star_stories?.length) return preparation.star_stories;
  const question = preparation?.questions?.find((item) => item.category === 'behavioral');
  return [{
    title: 'Your first reusable story',
    competency: 'Ownership',
    source_evidence: question?.suggested_answer || 'Choose a real project or responsibility from your resume.',
    situation: '',
    task: '',
    action: '',
    result: '',
    follow_up: 'What trade-off did you make, and what would you change next time?',
  }];
}

export default function StarStoryCoach({ preparation }) {
  const initialStories = useMemo(() => fallbackStories(preparation), [preparation]);
  const [stories, setStories] = useState(initialStories);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copyState, setCopyState] = useState('idle');
  const story = stories[activeIndex];

  if (!story) return null;

  const updateField = (field, value) => {
    setStories((current) => current.map((item, index) => (
      index === activeIndex ? { ...item, [field]: value } : item
    )));
    setCopyState('idle');
  };

  const answer = STAR_FIELDS
    .map(({ key, label }) => `${label}: ${story[key]?.trim() || 'Not completed yet.'}`)
    .join('\n\n');
  const wordCount = STAR_FIELDS.reduce(
    (total, { key }) => total + (story[key]?.trim().split(/\s+/).filter(Boolean).length || 0),
    0,
  );
  const completed = STAR_FIELDS.filter(({ key }) => story[key]?.trim()).length;

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(`${story.title}\n\n${answer}`);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
  };

  return (
    <div className="star-coach animate-fade-in-up">
      <div className="star-coach__intro">
        <div>
          <span className="eyebrow">Evidence-grounded practice</span>
          <h3>Build a story you can defend</h3>
          <p>Use the resume evidence as your boundary. Edit the outline in your own words and add only outcomes you can verify.</p>
        </div>
        <div className="star-coach__stats" aria-label="Story progress">
          <strong>{completed}/4</strong>
          <span>sections ready</span>
        </div>
      </div>

      <div className="story-switcher" role="tablist" aria-label="STAR stories">
        {stories.map((item, index) => (
          <button
            key={`${item.title}-${index}`}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            className={activeIndex === index ? 'is-active' : ''}
            onClick={() => { setActiveIndex(index); setCopyState('idle'); }}
          >
            <span>Story {index + 1}</span>
            <strong>{item.title}</strong>
          </button>
        ))}
      </div>

      <div className="star-coach__workspace">
        <aside className="evidence-card">
          <span>Source evidence</span>
          <blockquote>{story.source_evidence}</blockquote>
          <div>
            <small>Competency</small>
            <strong>{story.competency}</strong>
          </div>
          <div>
            <small>Likely follow-up</small>
            <p>{story.follow_up}</p>
          </div>
        </aside>

        <div className="star-fields">
          {STAR_FIELDS.map(({ key, label, prompt }, index) => (
            <label key={key} className="star-field">
              <span className="star-field__marker">{label[0]}</span>
              <span className="star-field__content">
                <strong>{label}</strong>
                <small>{prompt}</small>
                <textarea
                  value={story[key] || ''}
                  onChange={(event) => updateField(key, event.target.value)}
                  rows={index === 2 ? 5 : 3}
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="star-coach__footer">
        <p>
          <strong>{wordCount} words</strong>
          <span>≈ {Math.max(1, Math.ceil(wordCount / 130))} min spoken</span>
        </p>
        <button type="button" className="btn btn--primary" onClick={copyAnswer}>
          {copyState === 'copied' ? 'Copied to clipboard' : 'Copy STAR answer'}
        </button>
        {copyState === 'error' && <small role="alert">Clipboard access was unavailable. Select the text manually.</small>}
      </div>
    </div>
  );
}
