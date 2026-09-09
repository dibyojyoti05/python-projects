from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.job import JobResponse

class ApplicationBase(BaseModel):
    job_id: int
    status: str = "Saved"
    resume_version: Optional[str] = None
    cover_letter: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    resume_version: Optional[str] = None
    cover_letter: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    id: int
    user_id: int
    applied_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    job: Optional[JobResponse] = None
    model_config = {"from_attributes": True}
