from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class MessageBase(BaseModel):
    role: str
    content: str
    metadata_json: Optional[Dict[str, Any]] = None

class MessageCreate(MessageBase):
    chat_id: int

class Message(MessageBase):
    id: int
    chat_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatBase(BaseModel):
    title: str = "New Chat"
    model_name: str = "gemini/gemini-3.6-flash"
    workspace_id: Optional[int] = None

class ChatCreate(ChatBase):
    pass

class ChatUpdate(BaseModel):
    title: Optional[str] = None
    model_name: Optional[str] = None

class ChatInDBBase(ChatBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class Chat(ChatInDBBase):
    messages: List[Message] = []

class ChatList(ChatInDBBase):
    pass
