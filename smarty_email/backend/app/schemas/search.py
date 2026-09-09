from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.email import PriorityEnum

class SearchFilters(BaseModel):
    category: Optional[str] = Field(None, description="The category to filter by (e.g. 'Client', 'Job Opportunity')")
    priority: Optional[PriorityEnum] = Field(None, description="The priority to filter by (LOW, MEDIUM, HIGH, URGENT)")
    requires_response: Optional[bool] = Field(None, description="Filter for emails needing response")
    is_read: Optional[bool] = Field(None, description="Filter for read/unread emails")
    sender_contains: Optional[str] = Field(None, description="Filter by sender email or name")
    has_attachment: Optional[bool] = Field(None, description="Filter for emails with attachments")
