import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class ProviderBase(BaseModel):
    name: str
    provider_type: str # 'smtp', 'sendgrid', 'ses', etc.
    credentials: Dict[str, Any]
    is_active: bool = True

class ProviderCreate(ProviderBase):
    pass

class ProviderUpdate(ProviderBase):
    name: Optional[str] = None
    provider_type: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = None

class ProviderInDBBase(ProviderBase):
    id: uuid.UUID
    user_id: uuid.UUID
    health_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class Provider(ProviderInDBBase):
    # Depending on requirements, we might not want to return credentials directly in API responses
    # but for this admin platform, we assume users can manage their own credentials safely.
    pass
