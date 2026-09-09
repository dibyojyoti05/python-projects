import type { ResearchStatusResponse, HistoryResponse, ResearchPlan, PlanResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

export const generatePlan = async (query: string): Promise<PlanResponse> => {
  const response = await fetch(`${API_BASE_URL}/research/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error('Failed to generate research plan');
  return response.json();
};

export const startResearch = async (query: string, plan: ResearchPlan): Promise<{ research_id: string }> => {
  const response = await fetch(`${API_BASE_URL}/research/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, plan }),
  });
  if (!response.ok) throw new Error('Failed to start research');
  return response.json();
};

export const getResearchStatus = async (id: string): Promise<ResearchStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/research/${id}`);
  if (!response.ok) throw new Error('Failed to fetch research status');
  return response.json();
};

export const getHistory = async (): Promise<HistoryResponse[]> => {
  const response = await fetch(`${API_BASE_URL}/research/history/`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
};
