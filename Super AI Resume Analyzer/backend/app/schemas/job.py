from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobBase(BaseModel):
    title: str
    company: str
    description: str

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: int
    user_id: int
    requirements_extracted: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}
