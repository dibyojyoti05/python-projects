from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import UserPublic

class MessageBase(BaseModel):
    content: str
    message_type: str = "TEXT"
    reply_to_id: Optional[int] = None

class MessageUpdate(BaseModel):
    content: str

class MessageCreate(MessageBase):
    conversation_id: int

class MessageInDBBase(MessageBase):
    id: int
    conversation_id: int
    sender_id: int
    created_at: datetime
    updated_at: datetime
    edited_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
    
    model_config = {"from_attributes": True}

class MessagePublic(MessageInDBBase):
    sender: Optional[UserPublic] = None
    is_read: bool = False

