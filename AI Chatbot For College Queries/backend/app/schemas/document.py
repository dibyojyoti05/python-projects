from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    department_id: Optional[int] = None
    effective_date: Optional[datetime] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    version: int
    s3_key: str
    status: str
    uploaded_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class DocumentResponse(Document):
    url: Optional[str] = None
