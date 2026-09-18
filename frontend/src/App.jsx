import { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import FileUpload from './components/FileUpload';
import JobDescInput from './components/JobDescInput';
import AnalysisProgress from './components/AnalysisProgress';
import MatchScore from './components/MatchScore';
import SkillGapChart from './components/SkillGapChart';
import ResumeOptimizer from './components/ResumeOptimizer';
import InterviewPrep from './components/InterviewPrep';
import InterviewStudio from './components/InterviewStudio';
import Icon from './components/Icon';
import RecruiterWorkspace from './components/RecruiterWorkspace';
import ThemeToggle from './components/ThemeToggle';
import ModelSettings from './components/ModelSettings';
import ScoreMethodology from './components/ScoreMethodology';
import StarStoryCoach from './components/StarStoryCoach';
import { DEMO_ANALYSIS } from './data/demoAnalysis';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skill gaps' },
  { id: 'resume', label: 'Resume' },
  { id: 'interview', label: 'Question bank' },
  { id: 'star', label: 'STAR coach' },
];

export default function App() {
  const [cvFile, setCvFile] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [userMode, setUserMode] = useState('applicant');
  const [interviewActive, setInterviewActive] = useState(false);
  const [modelSettings, setModelSettings] = useState({
    provider: 'local',
    model: '',
    apiKey: '',
  });

  const { status, currentAgent, completedAgents, results, error, analyze, reset, loadDemo } =
    useAnalysis();

  const providerReady = modelSettings.provider === 'local' || modelSettings.apiKey.trim();
  const canAnalyze = cvFile && jobDesc.trim().length > 50 && providerReady && status !== 'loading';

  const handleAnalyze = () => {
    if (canAnalyze) {
      setActiveTab('overview');
      analyze(cvFile, jobDesc, modelSettings);
    }
  };

  const navigateWorkspace = (mode) => {
    setUserMode(mode);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleReset = () => {
    reset();
    setCvFile(null);
    setJobDesc('');
    setActiveTab('overview');
  };

  const handleDemo = () => {
    setActiveTab('overview');
    loadDemo(DEMO_ANALYSIS);
    requestAnimationFrame(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  const handleExport = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `openmatch-${results.job_title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {/* Header */}
      <header className="header">
        <div className="container header__inner">
          <button
            onClick={() => navigateWorkspace('applicant')}
            className="header__logo"
            aria-label="OpenMatch home"
          >
            <span className="brand-mark" aria-hidden="true">
              o<span>m</span>
            </span>
            <span>OpenMatch</span>
          </button>
          <nav className="workspace-nav" aria-label="Workspaces">
            <button
              aria-current={userMode === 'applicant' ? 'page' : undefined}
              onClick={() => navigateWorkspace('applicant')}
            >
              <Icon name="document" size={17} />
              <span>Application</span>
            </button>
            <button
              aria-current={userMode === 'interview' ? 'page' : undefined}
              onClick={() => navigateWorkspace('interview')}
            >
              <Icon name="mic" size={17} />
              <span>Interview studio</span>
            </button>
            <button
              aria-current={userMode === 'recruiter' ? 'page' : undefined}
              onClick={() => navigateWorkspace('recruiter')}
            >
              <Icon name="people" size={17} />
              <span>For recruiters</span>
            </button>
          </nav>
          <div className="header__actions">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="main" id="main-content">
        <div className="container">
          {/* Hero */}
          <section
            className={`hero ${userMode === 'interview' && interviewActive ? 'hero--compact' : ''}`}
            id="hero-section"
          >
            <span className="hero__eyebrow">
              {userMode === 'applicant'
                ? 'A clearer next step'
                : userMode === 'interview'
                  ? 'The interview studio'
                  : 'The hiring workspace'}
            </span>
            <h1 className="hero__title">
              {userMode === 'applicant' ? (
                <>
                  Your next role.
                  <br />
                  <em>A little more within reach.</em>
                </>
              ) : userMode === 'interview' ? (
                <>
                  Go in prepared.
                  <br /> <em>Sound like yourself.</em>
                </>
              ) : (
                <>
                  Good hiring starts
                  <br />
                  <em>with the evidence.</em>
                </>
              )}
            </h1>
            <p className="hero__subtitle">
              {userMode === 'applicant'
                ? 'Connect your experience to the role. See what fits, work on the gaps, and get ready for the conversation.'
                : userMode === 'interview'
                  ? 'Turn what you know into answers that land. Rehearse the conversation, one question at a time.'
                  : 'Compare candidates against the same role. Understand the match, then make your own call.'}
            </p>
            <span className="hero-margin-note">
              {userMode === 'interview'
                ? 'A little practice. A lot more clarity.'
                : 'Built around your experience.'}
            </span>
          </section>

          <div hidden={userMode !== 'interview'}>
            <InterviewStudio
              active={userMode === 'interview'}
              results={results}
              modelSettings={modelSettings}
              onModelChange={setModelSettings}
              onSessionChange={setInterviewActive}
            />
          </div>

          {userMode === 'recruiter' ? (
            <RecruiterWorkspace />
          ) : userMode === 'applicant' ? (
            <>
              {/* Input Panel */}
              {status !== 'done' && (
                <section className="animate-fade-in-up">
                  <div className="workspace-card">
                    <div className="workspace-card__header">
                      <div>
                        <span className="eyebrow">Start with the essentials</span>
                        <h2>Where you are. Where you want to go.</h2>
                      </div>
                      <ModelSettings value={modelSettings} onChange={setModelSettings} />
                    </div>

                    <div className="input-panel">
                      <div className="input-step">
                        <div className="input-step__heading">
                          <span>01</span>
                          <div>
                            <h3>Your resume</h3>
                            <p>The experience you’re bringing with you.</p>
                          </div>
                        </div>
                        <FileUpload file={cvFile} onFileSelect={setCvFile} />
                      </div>
                      <div className="input-step">
                        <div className="input-step__heading">
                          <span>02</span>
                          <div>
                            <h3>Target role</h3>
                            <p>The opportunity you have in mind.</p>
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
                        {!providerReady && <span>API key required</span>}
                      </div>
                      <div className="analyze-section__actions">
                        {status !== 'loading' && (
                          <button className="btn btn--secondary btn--large" onClick={handleDemo}>
                            Explore sample
                          </button>
                        )}
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
                            <span className="btn__arrow" aria-hidden="true">
                              →
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {status !== 'done' && status !== 'loading' && (
                <div className="next-chapter">
                  <div>
                    <span className="eyebrow">01 / Understand the fit</span>
                    <h3>More than a match score.</h3>
                    <p>
                      See the experience that supports your application, and the gaps worth your
                      attention.
                    </p>
                  </div>
                  <div>
                    <span className="eyebrow">02 / Prepare your story</span>
                    <h3>Make your experience count.</h3>
                    <p>
                      Refine your resume and build interview stories grounded in work you’ve
                      actually done.
                    </p>
                  </div>
                  <button onClick={() => navigateWorkspace('interview')} className="chapter-link">
                    <span className="eyebrow">03 / Find your rhythm</span>
                    <h3>Rehearse the conversation.</h3>
                    <p>Step into the interview studio. No resume needed.</p>
                    <span className="chapter-link__arrow">
                      <Icon name="arrow" />
                    </span>
                  </button>
                </div>
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
                  <AnalysisProgress currentAgent={currentAgent} completedAgents={completedAgents} />
                </section>
              )}

              {/* Results */}
              {status === 'done' && results && (
                <section className="results animate-fade-in-up" id="results-section">
                  <div className="results__header">
                    <div>
                      <span className="eyebrow">
                        {results.metadata?.analysis_mode === 'ai'
                          ? `${results.metadata.ai_provider === 'openai' ? 'OpenAI' : 'Gemini'} · ${results.metadata.model}`
                          : results.metadata?.analysis_mode === 'demo'
                            ? 'Interactive sample'
                            : 'Local analysis'}
                      </span>
                      <h2 className="results__title">{results.job_title}</h2>
                      <p>Your tailored application report</p>
                    </div>
                    <div className="results__actions">
                      <button onClick={handleExport} className="btn btn--secondary">
                        Export JSON
                      </button>
                      <button onClick={handleReset} className="btn btn--secondary">
                        New analysis
                      </button>
                    </div>
                  </div>

                  {results.metadata?.analysis_mode === 'demo' && (
                    <div className="demo-notice" role="status">
                      <div>
                        <strong>Guided sample</strong>
                        <p>
                          This report uses fictional candidate data so you can inspect every
                          workflow without uploading a file.
                        </p>
                      </div>
                      <button className="btn btn--secondary" onClick={handleReset}>
                        Use my resume
                      </button>
                    </div>
                  )}

                  {results.metadata?.analysis_mode === 'local' && (
                    <div className="mode-notice" role="status">
                      <span>Local evidence match</span>
                      <p>
                        Your resume was compared using transparent skill and evidence matching. No
                        files were stored.
                      </p>
                    </div>
                  )}

                  {/* Match Score */}
                  <MatchScore
                    score={results.match_score}
                    verdict={results.gap_analysis?.overall_verdict}
                  />

                  <ScoreMethodology
                    matchingSkills={results.gap_analysis?.matching_skills}
                    missingSkills={results.gap_analysis?.missing_skills}
                  />

                  <div className="report-practice">
                    <div>
                      <Icon name="mic" />
                      <div>
                        <strong>You’ve got the context. Now practice the conversation.</strong>
                        <p>Take this role into a mock interview with feedback on your answers.</p>
                      </div>
                    </div>
                    <button
                      className="btn btn--primary"
                      onClick={() => navigateWorkspace('interview')}
                    >
                      Practice this role <Icon name="arrow" size={17} />
                    </button>
                  </div>

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
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 12,
                              }}
                            >
                              <span
                                className={
                                  results.gap_analysis.experience_assessment.meets_requirements
                                    ? 'badge badge--success'
                                    : 'badge badge--warning'
                                }
                              >
                                {results.gap_analysis.experience_assessment.meets_requirements
                                  ? '✓ Meets Requirements'
                                  : '⚠ Gaps Identified'}
                              </span>
                            </div>
                            <p
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem',
                                lineHeight: 1.7,
                              }}
                            >
                              {results.gap_analysis.experience_assessment.assessment}
                            </p>
                            {results.gap_analysis.experience_assessment.strengths?.length > 0 && (
                              <div style={{ marginTop: 16 }}>
                                <p
                                  style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}
                                >
                                  Strengths:
                                </p>
                                {results.gap_analysis.experience_assessment.strengths.map(
                                  (s, i) => (
                                    <p
                                      key={i}
                                      style={{
                                        color: 'var(--accent-emerald)',
                                        fontSize: '0.85rem',
                                        padding: '2px 0',
                                      }}
                                    >
                                      ✓ {s}
                                    </p>
                                  ),
                                )}
                              </div>
                            )}
                            {results.gap_analysis.experience_assessment.gaps?.length > 0 && (
                              <div style={{ marginTop: 12 }}>
                                <p
                                  style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}
                                >
                                  Gaps:
                                </p>
                                {results.gap_analysis.experience_assessment.gaps.map((g, i) => (
                                  <p
                                    key={i}
                                    style={{
                                      color: 'var(--accent-rose)',
                                      fontSize: '0.85rem',
                                      padding: '2px 0',
                                    }}
                                  >
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
                          <div
                            className="card"
                            style={{
                              color: 'var(--text-secondary)',
                              fontSize: '0.9rem',
                              lineHeight: 1.7,
                            }}
                          >
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

                  {activeTab === 'star' && (
                    <StarStoryCoach preparation={results.interview_preparation} />
                  )}
                </section>
              )}
            </>
          ) : null}
        </div>
      </main>
      <footer className="app-footer container">
        <span>
          OpenMatch <span className="footer-dot">/</span> Make your next move a considered one.
        </span>
        <a href="https://github.com/Agneypraseed/OpenMatch" target="_blank" rel="noreferrer">
          Made in the open ↗
        </a>
      </footer>
    </div>
  );
}
