from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class EmailAnalysisResponse(BaseModel):
    id: uuid.UUID
    category: Optional[str] = None
    priority: Optional[str] = None
    intent: Optional[str] = None
    short_summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    requires_response: bool = False
    suggested_response: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    action_items: Optional[List[str]] = None

    model_config = {"from_attributes": True}

class EmailMessageResponse(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    provider_message_id: str
    thread_id: Optional[str] = None
    sender: str
    recipients: List[str]
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None
    subject: str
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    received_at: datetime
    is_read: bool = False
    is_starred: bool = False
    folder: str = "INBOX"
    analysis: Optional[EmailAnalysisResponse] = None

    model_config = {"from_attributes": True}

class EmailUpdate(BaseModel):
    is_read: Optional[bool] = None
    is_starred: Optional[bool] = None
    folder: Optional[str] = None

class EmailSendRequest(BaseModel):
    to: List[str]
    subject: str
    body: str
    reply_to_id: Optional[str] = None
