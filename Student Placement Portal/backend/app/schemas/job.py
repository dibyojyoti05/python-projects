from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str
    description: str
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    is_active: Optional[bool] = True
    
    # Eligibility & Deadlines
    deadline: Optional[datetime] = None
    min_cgpa: Optional[float] = 0.0
    max_backlogs: Optional[int] = 0
    eligible_branches: Optional[str] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_type: Optional[str] = None
    is_active: Optional[bool] = None
    deadline: Optional[datetime] = None
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    eligible_branches: Optional[str] = None

class JobOut(JobBase):
    id: int
    company_id: int
    company_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
