from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, HttpUrl
import uuid

class LinkBase(BaseModel):
    original_url: str
    custom_slug: Optional[str] = None
    expires_at: Optional[datetime] = None
    activates_at: Optional[datetime] = None
    click_limit: Optional[int] = None
    is_active: bool = True
    is_favorite: bool = False
    is_archived: bool = False
    
    # Advanced Routing
    geo_routing: Optional[Dict[str, str]] = None
    device_routing: Optional[Dict[str, str]] = None
    os_routing: Optional[Dict[str, str]] = None
    language_routing: Optional[Dict[str, str]] = None

class LinkCreate(LinkBase):
    organization_id: uuid.UUID
    domain_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    campaign_id: Optional[uuid.UUID] = None
    password: Optional[str] = None
    tags: Optional[List[str]] = []

class LinkUpdate(BaseModel):
    original_url: Optional[str] = None
    custom_slug: Optional[str] = None
    is_active: Optional[bool] = None
    is_favorite: Optional[bool] = None
    is_archived: Optional[bool] = None
    expires_at: Optional[datetime] = None
    activates_at: Optional[datetime] = None
    click_limit: Optional[int] = None

class LinkInDBBase(LinkBase):
    id: uuid.UUID
    short_code: str
    organization_id: uuid.UUID
    domain_id: Optional[uuid.UUID] = None
    folder_id: Optional[uuid.UUID] = None
    campaign_id: Optional[uuid.UUID] = None
    created_at: Optional[datetime] = None
    click_count: int = 0

    class Config:
        from_attributes = True

class Link(LinkInDBBase):
    pass

