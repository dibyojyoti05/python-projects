from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String, nullable=False) # E.g. Technical Interview
    interview_date = Column(DateTime(timezone=True), nullable=False)
    meeting_link = Column(String)
    interviewer = Column(String)
    notes = Column(Text)
    preparation_checklist = Column(Text)
    result = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application")

class FollowUp(Base):
    __tablename__ = "followups"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=False)
    is_completed = Column(Boolean, default=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    application = relationship("Application")
