from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationBase(BaseModel):
    status: Optional[str] = "Pending"
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_link: Optional[str] = None
    interview_round: Optional[str] = None

class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None
    interview_link: Optional[str] = None
    interview_round: Optional[str] = None

class ApplicationOut(ApplicationBase):
    id: int
    job_id: int
    student_id: int
    applied_at: datetime
    
    # Enriched student info
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    college: Optional[str] = None
    department: Optional[str] = None
    cgpa: Optional[float] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    resume_id: Optional[int] = None
    
    # Enriched job info
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    job_location: Optional[str] = None
    salary_range: Optional[str] = None

    class Config:
        from_attributes = True
