from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserPublic

class ConversationBase(BaseModel):
    type: str = "private"
    name: Optional[str] = None
    group_image: Optional[str] = None

class ConversationCreate(ConversationBase):
    participant_id: int

class GroupCreate(BaseModel):
    name: str
    participant_ids: List[int]

class ConversationInDBBase(ConversationBase):
    id: int
    created_at: datetime
    updated_at: datetime
    last_message_at: datetime
    
    model_config = {"from_attributes": True}

class ConversationPublic(ConversationInDBBase):
    other_user: Optional[UserPublic] = None
    unread_count: int = 0

class ConversationMemberPublic(BaseModel):
    user_id: int
    role: str
    joined_at: datetime
    user: Optional[UserPublic] = None

class AddMemberRequest(BaseModel):
    user_id: int

