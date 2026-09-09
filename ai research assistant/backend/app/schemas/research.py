from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime
from app.schemas.planner import ResearchPlan

class PlanRequest(BaseModel):
    query: str

class PlanResponse(BaseModel):
    plan: ResearchPlan

class ResearchRequest(BaseModel):
    query: str
    plan: ResearchPlan

class ResearchResponse(BaseModel):
    research_id: str
    status: str
    message: str

class Citation(BaseModel):
    source_id: str
    url: str

class ResearchReport(BaseModel):
    topic: str
    executive_summary: str
    key_findings: List[str]
    important_facts: List[str]
    benefits: List[str]
    risks: List[str]
    different_perspectives: List[str]
    research_gaps: List[str]
    conclusion: str
    citations: List[Citation]

class ResearchStatusResponse(BaseModel):
    research_id: str
    status: str
    query: str
    report: Optional[Dict[str, Any]] = None
    sources: Optional[List[Dict[str, Any]]] = None

class HistoryResponse(BaseModel):
    research_id: str
    query: str
    status: str
    created_at: datetime
