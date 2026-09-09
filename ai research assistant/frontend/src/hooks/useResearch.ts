import { useState, useEffect } from 'react';
import { getResearchStatus, startResearch, generatePlan } from '../services/api';
import type { ResearchStatusResponse, ResearchPlan } from '../types/index';

export const useResearch = () => {
  const [researchId, setResearchId] = useState<string | null>(null);
  const [status, setStatus] = useState<ResearchStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ResearchPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const requestPlan = async (query: string) => {
    try {
      setError(null);
      setPlan(null);
      setIsPlanning(true);
      const res = await generatePlan(query);
      setPlan(res.plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPlanning(false);
    }
  };

  const start = async (query: string, approvedPlan: ResearchPlan) => {
    try {
      setError(null);
      setStatus(null);
      const res = await startResearch(query, approvedPlan);
      setResearchId(res.research_id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!researchId) return;

    const poll = async () => {
      try {
        const currentStatus = await getResearchStatus(researchId);
        setStatus(currentStatus);
        
        if (currentStatus.status !== 'completed' && currentStatus.status !== 'failed') {
          setTimeout(poll, 2000);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    poll();
  }, [researchId]);

  return { requestPlan, start, status, setStatus, setResearchId, error, plan, setPlan, isPlanning };
};
