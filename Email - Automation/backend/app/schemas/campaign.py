import uuid
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from app.models.campaign import CampaignStatus

class CampaignBase(BaseModel):
    name: str
    subject: str
    content_html: str
    content_text: Optional[str] = None
    status: CampaignStatus = CampaignStatus.DRAFT
    scheduled_at: Optional[datetime] = None

class CampaignCreate(CampaignBase):
    provider_id: Optional[uuid.UUID] = None

class CampaignUpdate(CampaignBase):
    name: Optional[str] = None
    subject: Optional[str] = None
    content_html: Optional[str] = None
    status: Optional[CampaignStatus] = None
    provider_id: Optional[uuid.UUID] = None

class CampaignInDBBase(CampaignBase):
    id: uuid.UUID
    user_id: uuid.UUID
    provider_id: Optional[uuid.UUID]
    sent_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class Campaign(CampaignInDBBase):
    pass

class CampaignSendTestRequest(BaseModel):
    recipient_email: str
    context: Optional[dict] = None

class CampaignSendResponse(BaseModel):
    message: str
    campaign_id: uuid.UUID
    status: CampaignStatus
    total_recipients: int
    sent_count: int
    failed_count: int

class CampaignStats(BaseModel):
    campaign_id: uuid.UUID
    total_recipients: int
    sent_count: int
    opened_count: int
    clicked_count: int
    open_rate: float
    click_rate: float
