from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.financial import ReservationStatus, FineStatus

class ReservationBase(BaseModel):
    book_id: int
    member_id: int

class ReservationCreate(ReservationBase):
    pass

class Reservation(ReservationBase):
    id: int
    created_at: datetime
    status: ReservationStatus
    fulfilled_at: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    book_title: Optional[str] = None
    member_name: Optional[str] = None
    class Config:
        from_attributes = True

class FineBase(BaseModel):
    member_id: int
    loan_id: Optional[int] = None
    amount: float
    reason: Optional[str] = None

class FineCreate(FineBase):
    pass

class Fine(FineBase):
    id: int
    paid_amount: float
    status: FineStatus
    created_at: datetime
    member_name: Optional[str] = None
    member_barcode: Optional[str] = None
    book_title: Optional[str] = None
    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    fine_id: int
    amount: float
    payment_method: str = "cash"

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    paid_at: datetime
    processed_by_id: Optional[int] = None
    processed_by_name: Optional[str] = None
    member_name: Optional[str] = None
    fine_amount: Optional[float] = None
    class Config:
        from_attributes = True
