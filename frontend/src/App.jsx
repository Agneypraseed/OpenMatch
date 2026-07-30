import { useState } from 'react';
import { useAnalysis } from './hooks/useAnalysis';
import FileUpload from './components/FileUpload';
import JobDescInput from './components/JobDescInput';
import AnalysisProgress from './components/AnalysisProgress';
import MatchScore from './components/MatchScore';
import SkillGapChart from './components/SkillGapChart';
import ResumeOptimizer from './components/ResumeOptimizer';
import InterviewPrep from './components/InterviewPrep';
import ModeSwitcher from './components/ModeSwitcher';
import RecruiterWorkspace from './components/RecruiterWorkspace';
import ThemeToggle from './components/ThemeToggle';

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
  const [userMode, setUserMode] = useState('applicant');

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
          <div className="header__actions">
            <ModeSwitcher value={userMode} onChange={setUserMode} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {/* Hero */}
          <section className="hero" id="hero-section">
            <span className="hero__eyebrow">
              {userMode === 'applicant' ? 'Applicant workspace' : 'Recruiter workspace'}
            </span>
            <h1 className="hero__title">
              {userMode === 'applicant' ? (
                <>See how your resume<br /><span>matches the role.</span></>
              ) : (
                <>Shortlist candidates with<br /><span>reasons you can defend.</span></>
              )}
            </h1>
            <p className="hero__subtitle">
              {userMode === 'applicant'
                ? 'Every score links to evidence from your resume. Every gap comes with a specific next step.'
                : 'Compare every resume against the same role criteria and prepare useful feedback for every applicant.'}
            </p>
            <div className="hero__trust">
              <span className="product-principle">
                No score without evidence. No rejection without an understandable reason.
              </span>
            </div>
          </section>

          {userMode === 'recruiter' ? (
            <RecruiterWorkspace />
          ) : (
            <>
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
            </>
          )}
        </div>
      </main>
    </>
  );
}
