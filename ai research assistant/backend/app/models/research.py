from sqlalchemy import Column, String, Text, DateTime, JSON
from app.database.database import Base
from datetime import datetime

class ResearchSessionDB(Base):
    __tablename__ = "research_sessions"

    id = Column(String, primary_key=True, index=True)
    query = Column(String, index=True)
    status = Column(String, default="queued") # queued, searching, extracting, embedding, analyzing, generating, completed, failed
    report_json = Column(JSON, nullable=True)
    sources_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
