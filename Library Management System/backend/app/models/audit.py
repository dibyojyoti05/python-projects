from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.core.database import Base
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String, index=True, nullable=False)
    resource_type = Column(String, nullable=False) # e.g., 'book', 'member', 'fine'
    resource_id = Column(Integer, nullable=True)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
