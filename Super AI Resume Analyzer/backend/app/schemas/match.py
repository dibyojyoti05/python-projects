from pydantic import BaseModel, computed_field
from typing import List, Optional
from datetime import datetime
from app.schemas.resume import ResumeResponse
from app.schemas.job import JobResponse

class RecommendationBase(BaseModel):
    rec_type: str
    content: str

class RecommendationResponse(RecommendationBase):
    id: int
    model_config = {"from_attributes": True}

class MatchResultBase(BaseModel):
    resume_id: int
    job_id: int

class MatchResultResponse(MatchResultBase):
    id: int
    overall_score: float
    skill_score: Optional[float] = None
    semantic_score: Optional[float] = None
    experience_score: Optional[float] = None
    analysis_details: Optional[str] = None
    created_at: datetime
    resume: Optional[ResumeResponse] = None
    job: Optional[JobResponse] = None
    recommendations: List[RecommendationResponse] = []
    
    @computed_field
    @property
    def match_score(self) -> int:
        return int(self.overall_score)

    @computed_field
    @property
    def job_description_id(self) -> int:
        return self.job_id

    model_config = {"from_attributes": True}

class DirectMatchResponse(BaseModel):
    id: int
    job_id: int
    job_description_id: int
    resume_id: int
    match_score: int
    overall_score: float
    skill_score: float
    semantic_score: float
    experience_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    recommendations: List[str]
