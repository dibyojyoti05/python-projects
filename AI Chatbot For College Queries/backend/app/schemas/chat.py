from typing import List, Optional, Any
from pydantic import BaseModel
from datetime import datetime

class MessageBase(BaseModel):
    role: str
    content: str
    citations: Optional[str] = None

class MessageCreate(MessageBase):
    conversation_id: int

class Message(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    title: Optional[str] = None

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ConversationWithMessages(Conversation):
    messages: List[Message] = []

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
