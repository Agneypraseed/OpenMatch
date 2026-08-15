import { useState, useCallback } from 'react';
import { analyzeApplication } from '../services/api';

/**
 * Custom hook that manages the full analysis lifecycle:
 * loading, progress tracking, results, and error state.
 */
export function useAnalysis() {
  const [state, setState] = useState({
    status: 'idle', // idle | loading | done | error
    currentAgent: null,
    completedAgents: [],
    results: null,
    error: null,
  });

  const analyze = useCallback(async (cvFile, jobDescription, modelSettings) => {
    setState({
      status: 'loading',
      currentAgent: 'parsing',
      completedAgents: [],
      results: null,
      error: null,
    });

    try {
      const results = await analyzeApplication(cvFile, jobDescription, modelSettings, (agentId) => {
        setState((prev) => ({
          ...prev,
          currentAgent: agentId,
          completedAgents: prev.currentAgent
            ? [...prev.completedAgents.filter(a => a !== prev.currentAgent), prev.currentAgent]
            : prev.completedAgents,
        }));
      });

      setState({
        status: 'done',
        currentAgent: null,
        completedAgents: [
          'parsing', 'job_parser', 'cv_analyzer', 'rag',
          'gap_analyst', 'resume_optimizer', 'interview_coach'
        ],
        results,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        currentAgent: null,
        error: err.message || 'Analysis failed. Please try again.',
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      currentAgent: null,
      completedAgents: [],
      results: null,
      error: null,
    });
  }, []);

  const loadDemo = useCallback((demoResults) => {
    setState({
      status: 'done',
      currentAgent: null,
      completedAgents: [],
      results: demoResults,
      error: null,
    });
  }, []);

  return { ...state, analyze, reset, loadDemo };
}
