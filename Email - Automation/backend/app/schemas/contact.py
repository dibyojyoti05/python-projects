import uuid
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime

class ContactBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    attributes: Dict[str, Any] = {}
    is_subscribed: bool = True
    is_blacklisted: bool = False

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    is_subscribed: Optional[bool] = None
    is_blacklisted: Optional[bool] = None

class ContactInDBBase(ContactBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class Contact(ContactInDBBase):
    pass

class ContactBatchCreate(BaseModel):
    contacts: list[ContactCreate]

class ContactBulkImportResponse(BaseModel):
    total_parsed: int
    imported: int
    skipped_duplicates: int
    errors: list[str] = []
