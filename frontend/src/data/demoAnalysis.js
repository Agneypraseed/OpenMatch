export const DEMO_ANALYSIS = {
  job_title: 'Senior Backend Engineer',
  match_score: 78.6,
  job_requirements: {
    title: 'Senior Backend Engineer',
    required_skills: [],
  },
  gap_analysis: {
    matching_skills: [
      {
        skill: 'Python',
        status: 'strong_match',
        evidence: 'Built Python services that processed more than 2M events per day.',
        priority: 'critical',
      },
      {
        skill: 'FastAPI',
        status: 'strong_match',
        evidence: 'Designed and shipped versioned FastAPI endpoints for three internal products.',
        priority: 'critical',
      },
      {
        skill: 'PostgreSQL',
        status: 'strong_match',
        evidence: 'Reduced reporting query latency by 42% through indexing and query-plan analysis.',
        priority: 'critical',
      },
      {
        skill: 'AWS',
        status: 'strong_match',
        evidence: 'Operated containerized workloads on ECS with CloudWatch alerts and runbooks.',
        priority: 'important',
      },
      {
        skill: 'Kubernetes',
        status: 'partial_match',
        evidence: 'The resume shows Docker and ECS production experience, but not Kubernetes ownership.',
        priority: 'important',
      },
    ],
    missing_skills: [
      {
        skill: 'Terraform',
        status: 'missing',
        evidence: 'No explicit Terraform or infrastructure-as-code evidence was found.',
        priority: 'important',
      },
      {
        skill: 'Kafka',
        status: 'missing',
        evidence: 'Event processing is documented, but the messaging technology is not named.',
        priority: 'nice_to_have',
      },
    ],
    experience_assessment: {
      meets_requirements: true,
      assessment: 'The resume shows 6 years of backend experience against the role’s 5-year minimum, including production ownership and mentoring.',
      strengths: ['API design', 'Production ownership', 'Database performance'],
      gaps: ['Infrastructure as code', 'Direct Kubernetes ownership'],
    },
    education_assessment: 'The role accepts equivalent practical experience, which is supported by the resume.',
    overall_verdict: 'Strong backend alignment with specific evidence in Python, API design, and PostgreSQL. Tailor the application around production ownership and address the infrastructure-as-code gap directly.',
    top_priorities: [
      'Lead with the 42% database-latency improvement and explain how it was measured.',
      'Connect Docker and ECS experience to the role’s Kubernetes requirement without overstating experience.',
      'Add Terraform only if a real project, course, or lab can support the claim.',
    ],
  },
  resume_optimization: {
    tailored_summary: 'Backend engineer with 6 years of experience building reliable Python services, designing FastAPI contracts, and improving PostgreSQL performance. Experienced in production ownership on AWS and in turning operational evidence into measurable reliability improvements.',
    bullet_improvements: [
      {
        original: 'Responsible for improving slow database queries.',
        improved: 'Reduced reporting query latency by 42% by analyzing query plans, adding targeted indexes, and validating performance under production-like load.',
        rationale: 'Makes ownership, method, and verified impact immediately visible.',
      },
      {
        original: 'Worked on APIs with the product team.',
        improved: 'Designed and shipped versioned FastAPI endpoints for three internal products, partnering with product and frontend engineers on backward-compatible contracts.',
        rationale: 'Replaces a vague collaboration claim with scope and an engineering decision.',
      },
    ],
    keyword_suggestions: [
      {
        keyword: 'Infrastructure as code',
        where_to_add: 'Projects or professional development',
        context: 'Add only with a real Terraform project, course, or lab to support it.',
      },
      {
        keyword: 'Kubernetes',
        where_to_add: 'Skills gap plan',
        context: 'Describe adjacent container-orchestration experience honestly; do not imply production use.',
      },
    ],
    new_bullet_points: [
      'If accurate, add a reliability bullet that connects CloudWatch alerts, runbooks, and incident response.',
      'Quantify mentoring scope and the engineering outcome it improved.',
    ],
    formatting_tips: [
      'Put backend impact and production ownership in the top third of page one.',
      'Use consistent action + decision + outcome structure for experience bullets.',
      'Keep every metric traceable to something you can explain in an interview.',
    ],
  },
  interview_preparation: {
    role_summary: 'Expect the interview to test backend fundamentals, production judgment, API trade-offs, and how you respond when your experience only partially matches the stack.',
    star_stories: [
      {
        title: 'Cutting database latency by 42%',
        competency: 'Problem solving',
        source_evidence: 'Reduced reporting query latency by 42% through indexing and query-plan analysis.',
        situation: 'A business-critical reporting workflow had become slow enough to delay daily decisions for internal users.',
        task: 'I owned diagnosing the bottleneck and improving latency without changing the reports’ behavior or risking production stability.',
        action: 'I captured representative queries, compared execution plans, found two high-cost scans, introduced targeted indexes, and tested the change against production-like data before a staged rollout.',
        result: 'P95 query latency fell by 42%, restoring the reporting workflow’s response-time target without additional database capacity.',
        follow_up: 'How did you verify that the new indexes would not degrade write performance?',
      },
      {
        title: 'Designing stable API contracts',
        competency: 'Technical leadership',
        source_evidence: 'Designed and shipped versioned FastAPI endpoints for three internal products.',
        situation: 'Three product teams needed new capabilities from the same backend while existing clients could not break.',
        task: 'I was responsible for the API contract, rollout plan, and alignment across backend, frontend, and product stakeholders.',
        action: 'I documented compatibility constraints, proposed a versioned schema, added contract tests, and sequenced adoption with each client team.',
        result: 'All three products migrated without a client-facing regression, and the contract tests became part of the release gate.',
        follow_up: 'Why did you choose versioning instead of evolving the existing response?',
      },
    ],
    questions: [
      {
        question: 'Tell me about a difficult performance problem you solved.',
        category: 'behavioral',
        why_asked: 'To understand your diagnostic process, ownership, and ability to validate impact.',
        suggested_answer: 'Use the database-latency story. Spend most of the answer on how you narrowed the problem, the trade-offs behind the index strategy, and how you verified the 42% improvement.',
        tips: ['Keep the situation brief.', 'Be ready to explain the query plan.', 'Separate your contribution from the team’s.'],
      },
      {
        question: 'How do you design an API that can evolve safely?',
        category: 'technical',
        why_asked: 'The role owns public contracts used by several teams.',
        suggested_answer: 'Start with consumer constraints, describe compatibility and versioning options, then ground the answer in the three-product FastAPI migration.',
        tips: ['Discuss contract tests.', 'Mention observability and rollback.'],
      },
      {
        question: 'You have not used Kubernetes in production. How would you ramp up?',
        category: 'situational',
        why_asked: 'To test honesty, transfer learning, and the quality of your learning plan.',
        suggested_answer: 'State the gap plainly, connect ECS and Docker concepts that transfer, then give a concrete plan covering deployments, services, probes, resource limits, and one hands-on project.',
        tips: ['Do not relabel ECS work as Kubernetes.', 'Define what “productive” means after 30 days.'],
      },
    ],
    general_tips: [
      'Prepare the two STAR stories until each fits comfortably in 90 seconds.',
      'Expect follow-ups about alternatives, failure modes, and verification.',
      'Address missing skills directly and show a bounded learning plan.',
    ],
    topics_to_study: ['Kubernetes probes and deployments', 'Terraform state and modules', 'API compatibility strategies'],
  },
  evaluation: {
    quality_score: { overall_quality: 9.1 },
    retrieval_coverage: 0.86,
  },
  metadata: {
    processing_time_seconds: 1.34,
    agents_used: ['job_parser', 'cv_analyzer', 'gap_analyst', 'resume_optimizer', 'interview_coach'],
    cv_chunks_created: 8,
    skills_analyzed: 7,
    analysis_mode: 'demo',
  },
};
