from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum
from datetime import datetime

class ReservationStatus(str, enum.Enum):
    PENDING = "pending"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"
    EXPIRED = "expired"

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(ReservationStatus), default=ReservationStatus.PENDING, nullable=False)
    fulfilled_at = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)

    # Relationships
    book = relationship("Book")
    member = relationship("Member")

class FineStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"
    WAIVED = "waived"

class Fine(Base):
    __tablename__ = "fines"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    
    amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    status = Column(Enum(FineStatus), default=FineStatus.UNPAID, nullable=False)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    member = relationship("Member")
    loan = relationship("Loan")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    fine_id = Column(Integer, ForeignKey("fines.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, default="cash")
    paid_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_by_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    fine = relationship("Fine")
    processed_by = relationship("User")
