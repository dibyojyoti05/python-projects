from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.circulation import LoanStatus

class LoanBase(BaseModel):
    copy_id: int
    member_id: int

class LoanCreate(LoanBase):
    due_days: Optional[int] = 14

class Loan(LoanBase):
    id: int
    issued_by_id: Optional[int] = None
    issued_at: datetime
    due_date: datetime
    returned_at: Optional[datetime] = None
    renewal_count: int = 0
    status: LoanStatus

    class Config:
        from_attributes = True

class LoanWithDetails(BaseModel):
    id: int
    copy_id: int
    copy_barcode: str
    book_id: int
    book_title: str
    book_cover: Optional[str] = None
    member_id: int
    member_name: str
    member_barcode: str
    issued_by_id: Optional[int] = None
    issued_by_name: Optional[str] = None
    issued_at: datetime
    due_date: datetime
    returned_at: Optional[datetime] = None
    renewal_count: int = 0
    status: LoanStatus
    is_overdue: bool = False
    days_overdue: int = 0
    fine_amount: Optional[float] = None

    class Config:
        from_attributes = True

class LoanReturnResponse(BaseModel):
    loan_id: int
    status: str
    returned_at: datetime
    is_overdue: bool
    days_overdue: int
    fine_generated: Optional[float] = None
    message: str
