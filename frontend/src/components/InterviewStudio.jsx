import { useEffect, useRef, useState } from 'react';
import { interviewRequest } from '../services/api';
import useSpeechAnswer from '../hooks/useSpeechAnswer';
import Icon from './Icon';
import ModelSettings from './ModelSettings';

const STYLES = [
  { id: 'mixed', title: 'A little of everything', text: 'Experience, skills & judgment' },
  { id: 'behavioral', title: 'Your experience', text: 'Stories, decisions & teamwork' },
  { id: 'technical', title: 'Your craft', text: 'Knowledge, approach & trade-offs' },
];

function Feedback({ review }) {
  const { feedback, metrics } = review;
  return (
    <div className="practice-feedback">
      <div className="practice-feedback__heading">
        <span className="eyebrow">Coach’s notes</span>
        <span className="quiet-tag">
          {review.mode === 'local'
            ? 'Local practice'
            : `${review.mode === 'openai' ? 'OpenAI' : 'Gemini'} coach`}
        </span>
      </div>
      <h3>A little sharper, next time.</h3>
      <p>{feedback.summary}</p>
      <div className="feedback-columns">
        {feedback.strengths.length > 0 && (
          <div>
            <h4>Keep doing</h4>
            <ul>
              {feedback.strengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <h4>Try next</h4>
          <ul>
            {feedback.improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
      {feedback.language_notes.length > 0 && (
        <div className="language-notes">
          <h4>A note on wording</h4>
          {feedback.language_notes.map((note, i) => (
            <div key={i}>
              <p>
                <del>{note.original}</del>
                <span aria-hidden="true"> → </span>
                <strong>{note.improved}</strong>
              </p>
              <small>{note.explanation}</small>
            </div>
          ))}
        </div>
      )}
      <div className="delivery-strip">
        <div>
          <strong>{metrics.word_count}</strong>
          <span>words</span>
        </div>
        <div>
          <strong>{metrics.filler_count}</strong>
          <span>possible fillers</span>
        </div>
        <div>
          <strong>{metrics.words_per_minute ?? '—'}</strong>
          <span>
            {metrics.words_per_minute === null
              ? 'pace not measured'
              : `words/min · ${metrics.pace}`}
          </span>
        </div>
      </div>
      {metrics.words_per_minute !== null && (
        <small>
          Pace is an estimate over microphone-on time, including pauses. 100–180 words/min is a
          practice guide, not a score.
        </small>
      )}
      <p className="practice-note">{review.notice}</p>
    </div>
  );
}

export default function InterviewStudio({
  active,
  results,
  modelSettings,
  onModelChange,
  onSessionChange,
}) {
  const [role, setRole] = useState(null);
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('mixed');
  const [count, setCount] = useState(5);
  const [useReport, setUseReport] = useState(true);
  const [session, setSession] = useState(null);
  const [review, setReview] = useState(null);
  const [phase, setPhase] = useState('setup');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const speech = useSpeechAnswer(active);
  const request = useRef(null);
  const heading = useRef(null);
  const roleValue = role ?? (useReport ? results?.job_title : '') ?? '';
  const ready =
    roleValue.trim().length >= 2 &&
    (modelSettings.provider === 'local' || modelSettings.apiKey.trim());

  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => {
    onSessionChange(phase !== 'setup');
  }, [phase, onSessionChange]);
  useEffect(() => {
    if (!active) window.speechSynthesis?.cancel();
    return () => window.speechSynthesis?.cancel();
  }, [active]);

  async function call(action, data) {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      return await interviewRequest(action, data, controller.signal);
    } catch (err) {
      throw new Error(
        err.name === 'AbortError'
          ? 'The request timed out. Your answer is still here; please try again.'
          : err.message,
        { cause: err },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async function start(event) {
    event.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    const config = {
      role: roleValue.trim(),
      topic: topic.trim(),
      provider: modelSettings.provider,
      model: modelSettings.model,
      api_key: modelSettings.apiKey,
    };
    try {
      const result = await call('start', {
        ...config,
        style,
        question_count: count,
        context: useReport
          ? (results?.interview_preparation?.role_summary || '').slice(0, 6000)
          : '',
        prepared_questions: useReport
          ? (results?.interview_preparation?.questions || []).slice(0, 8).map((q) => q.question)
          : [],
      });
      setSession({
        config,
        questions: result.questions,
        index: 0,
        turns: [],
        prompt: result.questions[0],
        isFollowUp: false,
      });
      speech.reset();
      setReview(null);
      setPhase('answer');
      requestAnimationFrame(() => heading.current?.focus());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (busy || speech.recording || speech.starting || speech.answer.trim().length < 2) return;
    setBusy(true);
    setError('');
    window.speechSynthesis?.cancel();
    try {
      const result = await call('answer', {
        ...session.config,
        question: session.prompt.question,
        answer: speech.answer.trim(),
        input_mode: speech.spokenSeconds ? 'spoken' : 'typed',
        spoken_seconds: speech.spokenSeconds,
        history: session.turns
          .filter((t) => !t.skipped)
          .slice(-12)
          .map(({ question, answer }) => ({ question, answer })),
      });
      setReview(result);
      setSession((current) => ({
        ...current,
        turns: [
          ...current.turns,
          {
            question: current.prompt.question,
            answer: speech.answer.trim(),
            review: result,
            followUp: current.isFollowUp,
          },
        ],
      }));
      setPhase('feedback');
      requestAnimationFrame(() => heading.current?.focus());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function next(skip = false) {
    window.speechSynthesis?.cancel();
    const turns = skip
      ? [...session.turns, { question: session.prompt.question, answer: '', skipped: true }]
      : session.turns;
    const index = session.index + 1;
    setSession({ ...session, turns, index, prompt: session.questions[index], isFollowUp: false });
    setReview(null);
    speech.reset();
    setError('');
    setPhase(index >= session.questions.length ? 'recap' : 'answer');
    requestAnimationFrame(() => heading.current?.focus());
  }

  function followUp() {
    window.speechSynthesis?.cancel();
    setSession({
      ...session,
      prompt: { question: review.feedback.follow_up, category: 'follow-up' },
      isFollowUp: true,
    });
    setReview(null);
    speech.reset();
    setError('');
    setPhase('answer');
    requestAnimationFrame(() => heading.current?.focus());
  }

  function readQuestion() {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(session.prompt.question);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  function endSession() {
    window.speechSynthesis?.cancel();
    if (phase === 'answer' && speech.answer.trim()) {
      setSession((current) => ({
        ...current,
        turns: [
          ...current.turns,
          {
            question: current.prompt.question,
            answer: speech.answer.trim(),
            followUp: current.isFollowUp,
            unreviewed: true,
          },
        ],
      }));
    }
    setPhase('recap');
    requestAnimationFrame(() => heading.current?.focus());
  }

  function download() {
    const formatTurn = (turn, index) => {
      const lines = [`## ${index + 1}. ${turn.question}`];
      if (turn.skipped) return [...lines, '(Skipped)'].join('\n\n');
      if (turn.unreviewed) lines.push('(Draft — not reviewed)');
      lines.push(turn.answer);
      if (turn.review) {
        const { feedback, metrics, notice } = turn.review;
        lines.push(
          feedback.summary,
          `Keep doing:\n${feedback.strengths.map((s) => `- ${s}`).join('\n')}`,
          `Try next:\n${feedback.improvements.map((s) => `- ${s}`).join('\n')}`,
          `Wording:\n${feedback.language_notes.map((n) => `- ${n.original} → ${n.improved}: ${n.explanation}`).join('\n')}`,
          `Words: ${metrics.word_count} | Possible fillers: ${metrics.filler_count} | Words/min: ${metrics.words_per_minute ?? 'not measured'}`,
          notice,
        );
      }
      return lines.join('\n\n');
    };
    const text = [
      `# Interview practice — ${session.config.role}`,
      `Topic: ${session.config.topic || 'General'} | Coach: ${session.config.provider}`,
      ...session.turns.map(formatTurn),
    ].join('\n\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'openmatch-interview-notes.md';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (phase === 'setup')
    return (
      <div className="studio-setup">
        <form className="studio-form" onSubmit={start}>
          <div className="section-kicker">
            <span>01 / SET THE SCENE</span>
            <Icon name="mic" />
          </div>
          <h2>Make it your interview.</h2>
          <p>A few good questions. Space to think. Feedback you can use.</p>
          <label className="field-label" htmlFor="practice-role">
            What role are you preparing for?
          </label>
          <input
            id="practice-role"
            value={roleValue}
            onChange={(e) => setRole(e.target.value)}
            maxLength={120}
            placeholder="e.g. Backend engineer"
            required
            minLength={2}
          />
          <label className="field-label" htmlFor="practice-topic">
            Anything you want to focus on? <span>Optional</span>
          </label>
          <input
            id="practice-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            maxLength={180}
            placeholder="e.g. Python, leadership, product thinking"
          />
          {results && (
            <label className="report-choice">
              <input
                type="checkbox"
                checked={useReport}
                onChange={(e) => setUseReport(e.target.checked)}
              />
              <span>
                Use questions and role context from my{' '}
                {results.metadata?.analysis_mode === 'demo' ? 'sample ' : ''}report
              </span>
            </label>
          )}
          <fieldset className="style-options">
            <legend>Choose your focus</legend>
            {STYLES.map((option) => (
              <label key={option.id} className={style === option.id ? 'is-selected' : ''}>
                <input
                  type="radio"
                  name="interview-style"
                  value={option.id}
                  checked={style === option.id}
                  onChange={() => setStyle(option.id)}
                />
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.text}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="session-length">
            <span>Session length</span>
            <div role="group" aria-label="Number of questions">
              {[3, 5, 8].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={count === n}
                  onClick={() => setCount(n)}
                >
                  {n} questions
                </button>
              ))}
            </div>
          </div>
          <ModelSettings value={modelSettings} onChange={onModelChange} purpose="interview" />
          {error && (
            <p role="alert" className="inline-error">
              {error}
            </p>
          )}
          <button className="btn btn--primary studio-start" disabled={!ready || busy}>
            {busy ? (
              <>
                <span className="btn__spinner" /> Preparing your questions…
              </>
            ) : (
              <>
                Start interview <Icon name="arrow" />
              </>
            )}
          </button>
        </form>
        <aside className="studio-aside">
          <div className="practice-illustration" aria-hidden="true">
            <div className="illustration-orbit" />
            <div className="illustration-mic">
              <Icon name="mic" size={44} />
            </div>
            <span className="illustration-note">One question at a time.</span>
            <div className="illustration-wave">
              {[12, 25, 38, 21, 49, 32, 19, 41, 26, 13].map((height, i) => (
                <i key={i} style={{ height }} />
              ))}
            </div>
          </div>
          <span className="eyebrow">A rehearsal, not a test</span>
          <h3>
            Find the words.
            <br /> Then find your rhythm.
          </h3>
          <ol className="practice-steps">
            <li>
              <span>01</span>
              <div>
                <strong>Answer in your own words</strong>
                <p>Type, or use your microphone in a supported browser. Take your time.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>Go one level deeper</strong>
                <p>Try a follow-up question to explore your reasoning and the details.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Leave with something useful</strong>
                <p>
                  Review your answers, wording, and delivery. Download your notes for next time.
                </p>
              </div>
            </li>
          </ol>
          <p className="practice-note">
            Local practice works without an API key. Choose an AI coach for feedback tailored to the
            meaning of your answer.
          </p>
        </aside>
      </div>
    );

  if (phase === 'recap') {
    const answered = session.turns.filter((t) => !t.skipped);
    return (
      <section className="session-recap">
        <span className="eyebrow">Session complete</span>
        <h2 ref={heading} tabIndex={-1}>
          Good practice adds up.
        </h2>
        <p>
          You worked through {answered.length} answer{answered.length === 1 ? '' : 's'} for{' '}
          {session.config.role}. Pick one thing to improve on your next run.
        </p>
        <div className="recap-actions">
          <button className="btn btn--primary" onClick={download}>
            <Icon name="download" /> Download notes
          </button>
          <button
            className="btn btn--secondary"
            onClick={() => {
              setSession(null);
              setPhase('setup');
              speech.reset();
            }}
          >
            Practice again
          </button>
        </div>
        {answered.length === 0 && (
          <p className="empty-note">
            No answers were submitted. Start another session when you’re ready.
          </p>
        )}
        {session.turns.map((turn, i) => (
          <details className="recap-turn" key={i}>
            <summary>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <strong>{turn.question}</strong>
              <small>
                {turn.skipped
                  ? 'Skipped'
                  : turn.unreviewed
                    ? 'Draft · not reviewed'
                    : turn.followUp
                      ? 'Follow-up'
                      : 'Reviewed'}
              </small>
            </summary>
            {!turn.skipped && (
              <div>
                <blockquote>{turn.answer}</blockquote>
                {turn.review && <Feedback review={turn.review} />}
              </div>
            )}
          </details>
        ))}
      </section>
    );
  }

  return (
    <div className="live-studio">
      <aside className="session-sidebar">
        <span className="eyebrow">Your session</span>
        <h3>{session.config.role}</h3>
        <p>{session.config.topic || 'General interview practice'}</p>
        <ol>
          {session.questions.map((q, i) => (
            <li key={i} className={i === session.index ? 'is-current' : ''}>
              <span>
                {i < session.index ? (
                  <Icon name="check" size={14} />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              <div>
                {q.category}
                <small>
                  {i < session.index
                    ? 'Completed'
                    : i === session.index
                      ? 'In progress'
                      : 'Up next'}
                </small>
              </div>
            </li>
          ))}
        </ol>
        <p className="practice-note">
          {session.config.provider === 'local'
            ? 'Local practice · structure & wording checks'
            : `${session.config.provider === 'openai' ? 'OpenAI' : 'Gemini'} · contextual coaching`}
        </p>
        <button
          className="text-button"
          disabled={busy || speech.recording || speech.starting}
          onClick={endSession}
        >
          End session & review
        </button>
      </aside>
      <section className="session-main">
        <div className="question-meta">
          <span className="eyebrow">
            {session.isFollowUp
              ? 'A little deeper'
              : `Question ${session.index + 1} of ${session.questions.length}`}
          </span>
          <span className="quiet-tag">{session.prompt.category}</span>
        </div>
        <h2 ref={heading} tabIndex={-1}>
          {session.prompt.question}
        </h2>
        {'speechSynthesis' in window && (
          <button
            className="text-button listen-button"
            disabled={speech.recording || speech.starting || busy}
            onClick={readQuestion}
          >
            <Icon name="volume" size={17} /> Read question aloud
          </button>
        )}
        {phase === 'answer' ? (
          <form onSubmit={submit}>
            <div className="answer-label">
              <label className="field-label" htmlFor="interview-answer">
                Your answer
              </label>
              <span>
                {speech.answer.trim() ? speech.answer.trim().split(/\s+/).length : 0} words
              </span>
            </div>
            <textarea
              id="interview-answer"
              value={speech.answer}
              onChange={(e) => speech.edit(e.target.value)}
              disabled={speech.recording || speech.starting || busy}
              maxLength={12000}
              placeholder="Start with the situation. Tell us what you did, and what happened next."
              rows={8}
            />
            {speech.interim && (
              <p className="interim-transcript" aria-live="polite">
                {speech.interim}
              </p>
            )}
            <div className="voice-controls">
              <button
                type="button"
                className={`btn btn--secondary ${speech.recording ? 'is-recording' : ''}`}
                disabled={!speech.supported || busy}
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  if (speech.recording || speech.starting) speech.stop();
                  else speech.start();
                }}
              >
                <Icon name={speech.recording || speech.starting ? 'stop' : 'mic'} size={17} />
                {speech.recording
                  ? 'Stop listening'
                  : speech.starting
                    ? 'Cancel microphone'
                    : 'Use microphone'}
              </button>
              <span role="status">
                {speech.recording
                  ? `Listening · ${Math.floor(speech.seconds / 60)}:${String(Math.floor(speech.seconds % 60)).padStart(2, '0')}`
                  : speech.starting
                    ? 'Waiting for microphone…'
                    : 'English voice input'}
              </span>
            </div>
            <p className="practice-note">
              {speech.supported
                ? 'Your browser may send audio to its speech service. OpenMatch receives only the transcript when you submit. Review it first; editing disables the pace estimate.'
                : 'Voice input is unavailable in this browser. You can type your answer, or try a browser with speech recognition.'}
            </p>
            {speech.error && (
              <p className="inline-error" role="alert">
                {speech.error}
              </p>
            )}
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <div className="answer-actions">
              <button
                className="text-button"
                type="button"
                disabled={busy || speech.recording || speech.starting}
                onClick={() => next(true)}
              >
                Skip question
              </button>
              <button
                className="btn btn--primary"
                disabled={
                  busy || speech.recording || speech.starting || speech.answer.trim().length < 2
                }
              >
                {busy ? (
                  <>
                    <span className="btn__spinner" /> Reviewing answer…
                  </>
                ) : (
                  <>
                    Get feedback <Icon name="arrow" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <>
            <details className="your-answer">
              <summary>Your answer</summary>
              <blockquote>{speech.answer}</blockquote>
            </details>
            <Feedback review={review} />
            {!session.isFollowUp && (
              <div className="followup-invitation">
                <div>
                  <span className="eyebrow">Try a follow-up</span>
                  <p>{review.feedback.follow_up}</p>
                </div>
                <button className="btn btn--secondary" onClick={followUp}>
                  Go deeper <Icon name="arrow" size={16} />
                </button>
              </div>
            )}
            <div className="answer-actions">
              <span>Take one useful change into your next answer.</span>
              <button className="btn btn--primary" onClick={() => next()}>
                {session.index + 1 === session.questions.length
                  ? 'Finish & review'
                  : 'Next question'}
                <Icon name="arrow" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
