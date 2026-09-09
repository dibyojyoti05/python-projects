from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    
    overall_score = Column(Float, nullable=False)
    skill_score = Column(Float)
    semantic_score = Column(Float)
    experience_score = Column(Float)
    
    analysis_details = Column(Text) # Stored JSON of explanation
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume")
    job = relationship("Job")

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    match_result_id = Column(Integer, ForeignKey("match_results.id", ondelete="CASCADE"), nullable=False)
    rec_type = Column(String) # gap, strength, suggestion
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    match_result = relationship("MatchResult")
