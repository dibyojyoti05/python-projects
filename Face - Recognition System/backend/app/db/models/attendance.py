from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class Attendance(BaseModel):
    __tablename__ = "attendance"
    
    user_id = Column(ForeignKey("users.id"), nullable=False)
    record_date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime(timezone=True), nullable=True)
    check_out = Column(DateTime(timezone=True), nullable=True)
    work_duration_hours = Column(Float, default=0.0)
    status = Column(String, default="Present") # Present, Late, Half-day, Absent
    
    user = relationship("User", back_populates="attendance_records")
