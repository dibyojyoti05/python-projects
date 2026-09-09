from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DetectionEventBase(BaseModel):
    camera_id: int
    object_class: str
    confidence: float
    tracking_id: Optional[str] = None
    bounding_box: Optional[str] = None
    snapshot_path: Optional[str] = None
    zone_name: Optional[str] = None
    duration_seconds: float = 0.0

class DetectionEventCreate(DetectionEventBase):
    pass

class DetectionEventInDBBase(DetectionEventBase):
    id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class DetectionEvent(DetectionEventInDBBase):
    pass
