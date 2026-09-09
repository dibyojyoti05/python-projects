from pydantic import BaseModel
from typing import Optional, List

class CompanyBase(BaseModel):
    name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    company_size: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    company_size: Optional[str] = None

class CompanyOut(CompanyBase):
    id: int
    is_verified: bool

    class Config:
        from_attributes = True

class RecruiterProfileBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None

class RecruiterProfileCreate(RecruiterProfileBase):
    company_name: Optional[str] = None

class RecruiterProfileOut(RecruiterProfileBase):
    id: int
    user_id: int
    company_id: Optional[int] = None
    company: Optional[CompanyOut] = None

    class Config:
        from_attributes = True
