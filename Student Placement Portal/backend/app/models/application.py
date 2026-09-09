from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Application(Base):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "student_id", name="uq_job_student_application"),
    )

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("student_profiles.id"), nullable=False)
    
    status = Column(String, default="Pending") # Pending, Reviewed, Shortlisted, Rejected, Accepted
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True) # For recruiters to leave internal notes
    
    # Interview Scheduling
    interview_date = Column(DateTime(timezone=True), nullable=True)
    interview_link = Column(String, nullable=True)
    interview_round = Column(String, nullable=True)
    
    job = relationship("Job", back_populates="applications")
    student = relationship("StudentProfile", back_populates="applications")

