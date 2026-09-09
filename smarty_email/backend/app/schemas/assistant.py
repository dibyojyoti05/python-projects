from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AssistantMessage(BaseModel):
    role: str # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[AssistantMessage]] = None

class EmailCitation(BaseModel):
    id: str
    sender: str
    subject: str
    date: str
    priority: Optional[str] = None
    category: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    citations: Optional[List[EmailCitation]] = None
    suggested_actions: Optional[List[str]] = None
