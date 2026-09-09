from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    
    overall_score = Column(Integer, nullable=False, default=0)
    ats_score = Column(Integer, nullable=False, default=0)
    component_scores = Column(JSON, nullable=True) # {experience: 80, skills: 90...}
    
    strengths = Column(JSON, nullable=True) # list of strings
    weaknesses = Column(JSON, nullable=True) # list of strings
    suggestions = Column(JSON, nullable=True) # list of strings
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    resume = relationship("Resume")

