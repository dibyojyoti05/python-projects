from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InterviewBase(BaseModel):
    application_id: int
    stage: str
    interview_date: datetime
    meeting_link: Optional[str] = None
    interviewer: Optional[str] = None
    notes: Optional[str] = None
    preparation_checklist: Optional[str] = None
    result: Optional[str] = None

class InterviewCreate(InterviewBase):
    pass

class InterviewUpdate(BaseModel):
    stage: Optional[str] = None
    interview_date: Optional[datetime] = None
    meeting_link: Optional[str] = None
    interviewer: Optional[str] = None
    notes: Optional[str] = None
    preparation_checklist: Optional[str] = None
    result: Optional[str] = None

class InterviewResponse(InterviewBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}

class FollowUpBase(BaseModel):
    application_id: int
    due_date: datetime
    is_completed: bool = False
    notes: Optional[str] = None

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpUpdate(BaseModel):
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    notes: Optional[str] = None

class FollowUpResponse(FollowUpBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}
