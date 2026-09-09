from pydantic import BaseModel
from typing import Optional
from datetime import date
from app.models.member import MembershipType
from app.schemas.user import User

class MemberBase(BaseModel):
    user_id: int
    member_barcode: str
    membership_type: MembershipType = MembershipType.STANDARD
    registration_date: Optional[date] = None
    expiry_date: Optional[date] = None
    status: str = "active"
    borrowing_limit: int = 5
    phone: Optional[str] = None
    address: Optional[str] = None

class MemberCreate(MemberBase):
    pass

class MemberQuickCreate(BaseModel):
    full_name: str
    email: str
    password: str
    membership_type: MembershipType = MembershipType.STANDARD
    borrowing_limit: int = 5
    phone: Optional[str] = None
    address: Optional[str] = None
    branch_id: Optional[int] = None

class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    membership_type: Optional[MembershipType] = None
    borrowing_limit: Optional[int] = None
    status: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class Member(MemberBase):
    id: int
    user: User
    active_loans_count: int = 0
    unpaid_fines_amount: float = 0.0
    class Config:
        from_attributes = True
