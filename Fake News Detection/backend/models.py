from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    content_hash = Column(String(64), index=True, nullable=False)
    input_type = Column(String(10), default="text", nullable=False)  # 'text' or 'url'
    source_url = Column(Text, nullable=True)
    title = Column(String(255), nullable=True)
    cleaned_text = Column(Text, nullable=False)
    verdict = Column(String(20), nullable=False)  # 'Real', 'Fake', 'Satire', 'Unverified'
    confidence = Column(Integer, default=50, nullable=False)  # 0 to 100
    sensationalism_score = Column(Integer, default=0, nullable=False)  # 0 to 100
    bias_rating = Column(String(50), default="Neutral", nullable=False)
    reasoning = Column(Text, nullable=False)
    key_flags = Column(JSON, default=list, nullable=False)
    credibility_indicators = Column(JSON, default=list, nullable=False)
    times_queried = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    feedbacks = relationship("Feedback", back_populates="analysis", cascade="all, delete-orphan")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False)
    vote = Column(String(10), nullable=False)  # 'agree' | 'disagree'
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    analysis = relationship("Analysis", back_populates="feedbacks")
