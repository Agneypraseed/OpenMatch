/**
 * API service layer for the Job Application Assistant backend.
 */

const API_BASE = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:8000`;

async function parseResponse(response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = Array.isArray(error.detail)
      ? error.detail.map((item) => item.msg).filter(Boolean).join(' ')
      : error.detail;
    throw new Error(detail || `Server error: ${response.status}`);
  }
  return response.json();
}

function rethrowConnectionError(err) {
  if (err instanceof TypeError && err.message === 'Failed to fetch') {
    throw new Error(
      `Cannot reach the analysis server at ${API_BASE}. Check that the backend is running and try again.`,
      { cause: err }
    );
  }
  throw err;
}

/**
 * Run the full multi-agent analysis pipeline.
 *
 * @param {File} cvFile - The CV/resume PDF file
 * @param {string} jobDescription - The job description text
 * @param {function} onProgress - Callback for progress updates
 * @returns {Promise<object>} The full analysis response
 */
export async function analyzeApplication(cvFile, jobDescription, modelSettings, onProgress) {
  const formData = new FormData();
  formData.append('cv_file', cvFile);
  formData.append('job_description', jobDescription);
  formData.append('analysis_provider', modelSettings?.provider || 'local');
  if (modelSettings?.provider && modelSettings.provider !== 'local') {
    formData.append('model', modelSettings.model);
    formData.append('api_key', modelSettings.apiKey);
  }

  // Simulate agent progress since we use a single POST
  const agents = [
    { id: 'parsing', label: 'Extracting CV text', delay: 500 },
    { id: 'job_parser', label: 'Parsing job requirements', delay: 2000 },
    { id: 'cv_analyzer', label: 'Analyzing your CV', delay: 4000 },
    { id: 'rag', label: 'Building knowledge base', delay: 6000 },
    { id: 'gap_analyst', label: 'Analyzing skill gaps', delay: 9000 },
    { id: 'resume_optimizer', label: 'Generating improvements', delay: 12000 },
    { id: 'interview_coach', label: 'Preparing interview Q&A', delay: 15000 },
  ];

  // Start progress simulation
  const timers = agents.map((agent) =>
    setTimeout(() => onProgress?.(agent.id), agent.delay)
  );

  try {
    const response = await fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    // Clear remaining timers
    timers.forEach(clearTimeout);

    return await parseResponse(response);
  } catch (err) {
    timers.forEach(clearTimeout);
    rethrowConnectionError(err);
  }
}

export async function extractJobDescription(url) {
  try {
    const response = await fetch(`${API_BASE}/api/jobs/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return await parseResponse(response);
  } catch (err) {
    rethrowConnectionError(err);
  }
}

export async function analyzeRecruiterBatch(files, jobDescription, shortlistCount) {
  const formData = new FormData();
  files.forEach((file) => formData.append('cv_files', file));
  formData.append('job_description', jobDescription);
  formData.append('shortlist_count', String(shortlistCount));

  try {
    const response = await fetch(`${API_BASE}/api/recruiter/analyze`, {
      method: 'POST',
      body: formData,
    });
    return await parseResponse(response);
  } catch (err) {
    rethrowConnectionError(err);
  }
}

export async function sendFeedbackEmail({ recipient, subject, body, approved }) {
  try {
    const response = await fetch(`${API_BASE}/api/recruiter/feedback/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, subject, body, approved }),
    });
    return await parseResponse(response);
  } catch (err) {
    rethrowConnectionError(err);
  }
}

/**
 * Check if the backend is healthy.
 */
export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function interviewRequest(action, data, signal) {
  try {
    const response = await fetch(`${API_BASE}/api/interview/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal,
    });
    return await parseResponse(response);
  } catch (err) {
    rethrowConnectionError(err);
  }
}
