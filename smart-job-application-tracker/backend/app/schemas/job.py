from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobSourceBase(BaseModel):
    name: str
    base_url: Optional[str] = None
    is_active: bool = True

class JobSourceResponse(JobSourceBase):
    id: int
    model_config = {"from_attributes": True}

class JobBase(BaseModel):
    title: str
    company: str
    location: Optional[str] = None
    remote_type: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    employment_type: Optional[str] = None
    posted_at: Optional[datetime] = None
    source_url: str
    external_job_id: Optional[str] = None

class JobCreate(JobBase):
    source_id: Optional[int] = None

class JobResponse(JobBase):
    id: int
    source_id: Optional[int] = None
    created_at: datetime
    model_config = {"from_attributes": True}

class SavedJobResponse(BaseModel):
    id: int
    user_id: int
    job_id: int
    saved_at: datetime
    job: JobResponse
    model_config = {"from_attributes": True}
