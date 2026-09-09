from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class UnansweredQuestionBase(BaseModel):
    question: str
    user_id: Optional[int] = None
    conversation_id: Optional[int] = None

class UnansweredQuestionCreate(UnansweredQuestionBase):
    pass

class UnansweredQuestion(UnansweredQuestionBase):
    id: int
    resolved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
