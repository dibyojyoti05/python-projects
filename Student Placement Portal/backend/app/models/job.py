from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, Float, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    salary_range = Column(String, nullable=True)
    job_type = Column(String, nullable=True) # Full-time, Internship, Part-time
    is_active = Column(Boolean, default=True)
    
    # Eligibility & Deadlines
    deadline = Column(DateTime(timezone=True), nullable=True)
    min_cgpa = Column(Float, default=0.0)
    max_backlogs = Column(Integer, default=0)
    eligible_branches = Column(String, nullable=True) # e.g. "Computer Science, Information Technology"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    
    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job")

