/**
 * Animated timeline showing multi-agent pipeline progress.
 * Each step transitions through: pending → active → done.
 */

const AGENTS = [
  { id: 'parsing', label: 'Reading your resume', desc: 'Extracting text from the PDF' },
  { id: 'job_parser', label: 'Understanding the role', desc: 'Mapping responsibilities and requirements' },
  { id: 'cv_analyzer', label: 'Building your profile', desc: 'Finding skills and experience evidence' },
  { id: 'rag', label: 'Connecting the evidence', desc: 'Relating your background to the role' },
  { id: 'gap_analyst', label: 'Calculating your match', desc: 'Weighing strengths and gaps' },
  { id: 'resume_optimizer', label: 'Tailoring your resume', desc: 'Preparing evidence-based improvements' },
  { id: 'interview_coach', label: 'Preparing your interview', desc: 'Creating role-specific practice prompts' },
];

export default function AnalysisProgress({ currentAgent, completedAgents }) {
  const getStepStatus = (agentId) => {
    if (completedAgents.includes(agentId)) return 'done';
    if (currentAgent === agentId) return 'active';
    return 'pending';
  };

  return (
    <div className="progress-timeline" aria-label="Analysis progress">
      {AGENTS.map((agent, i) => {
        const status = getStepStatus(agent.id);
        return (
          <div
            key={agent.id}
            className={`progress-step progress-step--${status}`}
          >
            <div className="progress-step__dot">
              {status === 'done' ? '✓' : status === 'active' ? (
                <span className="progress-step__spinner" aria-hidden="true" />
              ) : (
                i + 1
              )}
            </div>
            <div className="progress-step__content">
              <div className="progress-step__title">{agent.label}</div>
              <div className="progress-step__desc">{agent.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
