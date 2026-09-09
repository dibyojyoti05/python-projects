from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    parsed_text = Column(Text)
    version = Column(Integer, default=1)
    target_role = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

class ResumeEmbedding(Base):
    __tablename__ = "resume_embeddings"
    
    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    embedding = Column(JSON) # Stores 384-d float vector embeddings
    model_version = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    resume = relationship("Resume")

