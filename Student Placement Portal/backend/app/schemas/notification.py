from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    link: Optional[str] = None
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
