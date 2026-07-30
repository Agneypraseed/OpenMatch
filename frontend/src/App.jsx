import { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import FileUpload from './components/FileUpload';
import JobDescInput from './components/JobDescInput';
import AnalysisProgress from './components/AnalysisProgress';
import MatchScore from './components/MatchScore';
import SkillGapChart from './components/SkillGapChart';
import ResumeOptimizer from './components/ResumeOptimizer';
import InterviewPrep from './components/InterviewPrep';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skill gaps' },
  { id: 'resume', label: 'Resume' },
  { id: 'interview', label: 'Interview' },
];

export default function App() {
  const [cvFile, setCvFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const {
    status,
    currentAgent,
    completedAgents,
    results,
    error,
    analyze,
    reset,
  } = useAnalysis();

  const canAnalyze = cvFile && jobDesc.trim().length > 50 && status !== 'loading';

  const handleAnalyze = () => {
    if (canAnalyze) {
      setActiveTab('overview');
      analyze(cvFile, jobDesc);
    }
  };

  const handleReset = () => {
    reset();
    setCvFile(null);
    setJobDesc('');
    setActiveTab('overview');
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="container header__inner">
          <a href="/" className="header__logo">
            <span className="header__logo-icon" aria-hidden="true">
              <span />
            </span>
            <span>
              Matchline
              <small>Application workspace</small>
            </span>
          </a>
          <a
            href="https://github.com/Agneypraseed"
            target="_blank"
            rel="noopener noreferrer"
            className="header__github"
            aria-label="View source on GitHub"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.18c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.73 1.16 1.73 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.72-1.5-2.5-.29-5.13-1.25-5.13-5.54 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.08 1.15A10.7 10.7 0 0 1 12 6.07c.95 0 1.9.13 2.8.38 2.14-1.45 3.08-1.15 3.08-1.15.62 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.02 0 4.3-2.63 5.25-5.14 5.53.4.35.76 1.03.76 2.08v3.18c0 .3.2.65.78.54A11.2 11.2 0 0 0 12 .8Z" />
            </svg>
            <span>Source</span>
          </a>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Hero */}
          <section className="hero" id="hero-section">
            <span className="hero__eyebrow">Application intelligence, grounded in your experience</span>
            <h1 className="hero__title">
              Make your experience<br />
              <span>impossible to overlook.</span>
            </h1>
            <p className="hero__subtitle">
              Compare your resume to any role, find the evidence that matters, and
              leave with a sharper application and a focused interview plan.
            </p>
            <div className="hero__trust">
              <span><i aria-hidden="true">✓</i> Private local analysis</span>
              <span><i aria-hidden="true">✓</i> No account required</span>
              <span><i aria-hidden="true">✓</i> Results in seconds</span>
            </div>
          </section>

          {/* Input Panel */}
          {status !== 'done' && (
            <section className="animate-fade-in-up">
              <div className="workspace-card">
                <div className="workspace-card__header">
                  <div>
                    <span className="eyebrow">New analysis</span>
                    <h2>Build your match report</h2>
                  </div>
                  <span className="workspace-card__privacy">
                    <span aria-hidden="true" /> Processed in memory
                  </span>
                </div>

                <div className="input-panel">
                  <div className="input-step">
                    <div className="input-step__heading">
                      <span>01</span>
                      <div>
                        <h3>Your resume</h3>
                        <p>Use a text-based PDF for the best result.</p>
                      </div>
                    </div>
                    <FileUpload file={cvFile} onFileSelect={setCvFile} />
                  </div>
                  <div className="input-step">
                    <div className="input-step__heading">
                      <span>02</span>
                      <div>
                        <h3>Target role</h3>
                        <p>Include the full posting for a clearer comparison.</p>
                      </div>
                    </div>
                    <JobDescInput value={jobDesc} onChange={setJobDesc} />
                  </div>
                </div>

                <div className="analyze-section">
                  <div className="analyze-section__status" aria-live="polite">
                    <span className={cvFile ? 'is-complete' : ''}>
                      {cvFile ? '✓ Resume added' : 'Resume required'}
                    </span>
                    <span className={jobDesc.trim().length > 50 ? 'is-complete' : ''}>
                      {jobDesc.trim().length > 50 ? '✓ Role added' : '50+ characters required'}
                    </span>
                  </div>
                  {status === 'loading' ? (
                    <button className="btn btn--primary btn--large" disabled>
                      <span className="btn__spinner" aria-hidden="true" />
                      Building report
                    </button>
                  ) : (
                    <button
                      id="analyze-button"
                      className="btn btn--primary btn--large"
                      onClick={handleAnalyze}
                      disabled={!canAnalyze}
                    >
                      Analyze application
                      <span className="btn__arrow" aria-hidden="true">→</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Error */}
          {error && (
            <div className="error-banner animate-fade-in">
              <div>
                <strong>We couldn’t complete the analysis</strong>
                <p>{error}</p>
              </div>
              <button
                onClick={handleReset}
                style={{
                  marginTop: 12,
                  background: 'none',
                  border: '1px solid currentColor',
                  color: 'inherit',
                  padding: '8px 16px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family)',
                }}
              >
                Start over
              </button>
            </div>
          )}

          {/* Loading Progress */}
          {status === 'loading' && (
            <section className="analysis-loading">
              <div className="analysis-loading__header">
                <span className="eyebrow">In progress</span>
                <h2>Building your report</h2>
                <p>We’re connecting your experience to the role’s priorities.</p>
              </div>
              <AnalysisProgress
                currentAgent={currentAgent}
                completedAgents={completedAgents}
              />
            </section>
          )}

          {/* Results */}
          {status === 'done' && results && (
            <section className="results animate-fade-in-up" id="results-section">
              <div className="results__header">
                <div>
                  <span className="eyebrow">
                    {results.metadata?.analysis_mode === 'ai' ? 'AI analysis' : 'Local analysis'}
                  </span>
                  <h2 className="results__title">
                    {results.job_title}
                  </h2>
                  <p>Your tailored application report</p>
                </div>
                <button
                  onClick={handleReset}
                  className="btn"
                  style={{
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-medium)',
                    marginTop: 12,
                  }}
                >
                  New analysis
                </button>
              </div>

              {results.metadata?.analysis_mode === 'local' && (
                <div className="mode-notice" role="status">
                  <span>Local evidence match</span>
                  <p>
                    Your resume was compared using transparent skill and evidence matching.
                    No files were stored.
                  </p>
                </div>
              )}

              {/* Match Score */}
              <MatchScore
                score={results.match_score}
                verdict={results.gap_analysis?.overall_verdict}
              />

              {/* Tabs */}
              <div className="tabs" role="tablist">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    id={`tab-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="animate-fade-in">
                  {/* Top Priorities */}
                  <div style={{ marginBottom: 32 }}>
                    <div className="section-header">
                      <span className="section-header__icon">01</span>
                      <h3 className="section-header__title">Your next moves</h3>
                    </div>
                    <div className="stagger-children">
                      {results.gap_analysis?.top_priorities?.map((p, i) => (
                        <div key={i} className="skill-item" style={{ marginBottom: 8 }}>
                          <span className="skill-item__icon" style={{ fontSize: '1rem' }}>
                            {i + 1}.
                          </span>
                          <div className="skill-item__info">
                            <div className="skill-item__name">{p}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Experience Assessment */}
                  {results.gap_analysis?.experience_assessment && (
                    <div style={{ marginBottom: 32 }}>
                      <div className="section-header">
                        <span className="section-header__icon">02</span>
                        <h3 className="section-header__title">Experience Assessment</h3>
                      </div>
                      <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                          <span className={
                            results.gap_analysis.experience_assessment.meets_requirements
                              ? 'badge badge--success' : 'badge badge--warning'
                          }>
                            {results.gap_analysis.experience_assessment.meets_requirements
                              ? '✓ Meets Requirements' : '⚠ Gaps Identified'}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                          {results.gap_analysis.experience_assessment.assessment}
                        </p>
                        {results.gap_analysis.experience_assessment.strengths?.length > 0 && (
                          <div style={{ marginTop: 16 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Strengths:</p>
                            {results.gap_analysis.experience_assessment.strengths.map((s, i) => (
                              <p key={i} style={{ color: 'var(--accent-emerald)', fontSize: '0.85rem', padding: '2px 0' }}>
                                ✓ {s}
                              </p>
                            ))}
                          </div>
                        )}
                        {results.gap_analysis.experience_assessment.gaps?.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>Gaps:</p>
                            {results.gap_analysis.experience_assessment.gaps.map((g, i) => (
                              <p key={i} style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', padding: '2px 0' }}>
                                ✗ {g}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Education Assessment */}
                  {results.gap_analysis?.education_assessment && (
                    <div style={{ marginBottom: 32 }}>
                      <div className="section-header">
                        <span className="section-header__icon">03</span>
                        <h3 className="section-header__title">Education Assessment</h3>
                      </div>
                      <div className="card" style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                      }}>
                        {results.gap_analysis.education_assessment}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  {results.metadata && (
                    <div className="metadata">
                      <div className="metadata__item">
                        <div className="metadata__value">
                          {results.metadata.processing_time_seconds}s
                        </div>
                        <div className="metadata__label">Processing Time</div>
                      </div>
                      <div className="metadata__item">
                        <div className="metadata__value">
                          {results.metadata.agents_used?.length || 0}
                        </div>
                        <div className="metadata__label">Analysis Steps</div>
                      </div>
                      <div className="metadata__item">
                        <div className="metadata__value">
                          {results.metadata.skills_analyzed || 0}
                        </div>
                        <div className="metadata__label">Skills Analyzed</div>
                      </div>
                      <div className="metadata__item">
                        <div className="metadata__value">
                          {results.metadata.cv_chunks_created || 0}
                        </div>
                        <div className="metadata__label">CV Chunks</div>
                      </div>
                      {results.evaluation?.quality_score && (
                        <div className="metadata__item">
                          <div className="metadata__value">
                            {results.evaluation.quality_score.overall_quality}/10
                          </div>
                          <div className="metadata__label">Quality Score</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <SkillGapChart
                  matchingSkills={results.gap_analysis?.matching_skills}
                  missingSkills={results.gap_analysis?.missing_skills}
                />
              )}

              {activeTab === 'resume' && (
                <ResumeOptimizer optimization={results.resume_optimization} />
              )}

              {activeTab === 'interview' && (
                <InterviewPrep preparation={results.interview_preparation} />
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
