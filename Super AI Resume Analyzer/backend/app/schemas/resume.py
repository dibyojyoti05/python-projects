from pydantic import BaseModel, computed_field
from typing import Optional, List, Dict
from datetime import datetime

class ResumeBase(BaseModel):
    filename: str
    target_role: Optional[str] = None

class ResumeResponse(ResumeBase):
    id: int
    user_id: int
    version: int
    created_at: datetime
    title: Optional[str] = None
    
    @computed_field
    @property
    def resume_id(self) -> int:
        return self.id

    model_config = {"from_attributes": True}

class ResumeAnalysisResponse(BaseModel):
    skills: list[str]
    experience: list[str]
    education: list[str]
    projects: list[str]
    certifications: list[str]
    summary: str

class ResumeReportAnalysis(BaseModel):
    overall_score: int
    ats_score: int
    component_scores: Dict[str, int]
    strengths: List[str]
    weaknesses: List[str]
    suggestions: List[str]

class ResumeReportResponse(BaseModel):
    version_id: int
    analysis: ResumeReportAnalysis
