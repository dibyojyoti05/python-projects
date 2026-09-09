from pydantic import BaseModel, EmailStr
from app.models.user import RoleEnum

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: RoleEnum = RoleEnum.STUDENT

class UserResponse(UserBase):
    id: int
    role: RoleEnum
    is_active: bool
    
    class Config:
        from_attributes = True
