from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from app.models.qr_code import QRCodeType

class QRCodeBase(BaseModel):
    name: str
    is_dynamic: bool = True
    qr_type: QRCodeType = QRCodeType.URL
    destination_url: Optional[str] = None
    raw_data: Optional[str] = None
    customization: Dict[str, Any] = {}
    is_active: bool = True
    password_hash: Optional[str] = None
    expires_at: Optional[datetime] = None
    scan_limit: Optional[int] = None

class QRCodeCreate(QRCodeBase):
    organization_id: Optional[UUID] = None
    campaign_id: Optional[UUID] = None

class QRCodeUpdate(BaseModel):
    name: Optional[str] = None
    destination_url: Optional[str] = None
    raw_data: Optional[str] = None
    customization: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    campaign_id: Optional[UUID] = None
    password_hash: Optional[str] = None
    expires_at: Optional[datetime] = None
    scan_limit: Optional[int] = None

class QRCodeInDBBase(QRCodeBase):
    id: UUID
    organization_id: UUID
    campaign_id: Optional[UUID] = None
    short_code: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    scan_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class QRCode(QRCodeInDBBase):
    pass

class QRCodeAnalytics(BaseModel):
    total_scans: int
    unique_visitors: int
    last_scanned_at: Optional[datetime] = None
    devices: Dict[str, int] = {}
    browsers: Dict[str, int] = {}
    operating_systems: Dict[str, int] = {}
    recent_scans: List[Dict[str, Any]] = []
