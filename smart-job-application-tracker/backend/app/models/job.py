from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.user import User


class JobSource(Base):
    __tablename__ = "job_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    base_url = Column(String)
    is_active = Column(Boolean, default=True)

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    company = Column(String, index=True, nullable=False)
    location = Column(String)
    remote_type = Column(String) # Remote, Hybrid, On-site
    salary = Column(String)
    description = Column(Text)
    requirements = Column(Text)
    employment_type = Column(String) # Full-time, Part-time, Contract
    posted_at = Column(DateTime(timezone=True))
    source_id = Column(Integer, ForeignKey("job_sources.id"))
    source_url = Column(String, unique=True, nullable=False)
    external_job_id = Column(String, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    source = relationship("JobSource")

class SavedJob(Base):
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    job = relationship("Job")
