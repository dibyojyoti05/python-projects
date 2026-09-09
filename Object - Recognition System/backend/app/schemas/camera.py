from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CameraBase(BaseModel):
    name: str
    location: Optional[str] = None
    rtsp_url: str
    ai_enabled: bool = True

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    rtsp_url: Optional[str] = None
    ai_enabled: Optional[bool] = None
    is_active: Optional[bool] = None

class CameraInDBBase(CameraBase):
    id: int
    is_active: bool
    is_connected: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Camera(CameraInDBBase):
    pass
