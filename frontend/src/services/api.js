/**
 * API service layer for the Job Application Assistant backend.
 */

const API_BASE = import.meta.env.VITE_API_URL
  || `${window.location.protocol}//${window.location.hostname}:8000`;

/**
 * Run the full multi-agent analysis pipeline.
 *
 * @param {File} cvFile - The CV/resume PDF file
 * @param {string} jobDescription - The job description text
 * @param {function} onProgress - Callback for progress updates
 * @returns {Promise<object>} The full analysis response
 */
export async function analyzeApplication(cvFile, jobDescription, onProgress) {
  const formData = new FormData();
  formData.append('cv_file', cvFile);
  formData.append('job_description', jobDescription);

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

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Server error: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    timers.forEach(clearTimeout);
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Cannot reach the analysis server at ${API_BASE}. Check that the backend is running and try again.`,
        { cause: err }
      );
    }
    throw err;
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
