from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum

class MembershipType(str, enum.Enum):
    STANDARD = "standard"
    PREMIUM = "premium"
    STUDENT = "student"
    STAFF = "staff"

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    member_barcode = Column(String, unique=True, index=True, nullable=False)
    membership_type = Column(Enum(MembershipType), default=MembershipType.STANDARD)
    registration_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(String, default="active") # active, suspended, expired
    borrowing_limit = Column(Integer, default=5)
    phone = Column(String)
    address = Column(String)

    # Relationships
    user = relationship("User")
    loans = relationship("Loan", back_populates="member")
