from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    profile_photo: Optional[str] = None

class UserInDB(UserBase):
    id: int
    profile_photo: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_seen: Optional[datetime] = None
    
    model_config = {"from_attributes": True}
    
class UserPublic(UserInDB):
    pass
