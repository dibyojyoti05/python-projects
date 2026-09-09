export interface ResearchPlan {
  topic: string;
  research_depth: string;
  target_pages: number;
  target_words: number;
  minimum_sources: number;
  maximum_sources: number;
  source_recency_years: number;
  source_types: string[];
  include_statistics: boolean;
  compare_sources: boolean;
  identify_research_gaps: boolean;
  include_future_trends: boolean;
  citation_style: string;
  recommended_sections: string[];
  reasoning: string;
}

export interface PlanResponse {
  plan: ResearchPlan;
}

export interface Citation {
  source_id: string;
  url: string;
}

export interface ResearchReportData {
  topic: string;
  executive_summary: string;
  key_findings: string[];
  important_facts: string[];
  benefits: string[];
  risks: string[];
  different_perspectives: string[];
  research_gaps: string[];
  conclusion: string;
  citations: Citation[];
}

export interface Source {
  source_id: string;
  url: string;
  title: string;
}

export interface ResearchStatusResponse {
  research_id: string;
  status: 'queued' | 'searching' | 'extracting' | 'embedding' | 'analyzing' | 'generating' | 'completed' | 'failed';
  query: string;
  report?: ResearchReportData;
  sources?: Source[];
}

export interface HistoryResponse {
  research_id: string;
  query: string;
  status: string;
  created_at: string;
}
