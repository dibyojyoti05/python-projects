import uuid
from typing import Any
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declared_attr
from app.db.base_class import Base

class Notification(Base):
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return "notifications"

    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Any = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    title: Any = Column(String, nullable=False)
    message: Any = Column(String, nullable=False)
    type: Any = Column(String, nullable=False) # e.g. "info", "success", "warning", "error"
    is_read: Any = Column(Boolean, default=False)
    created_at: Any = Column(DateTime(timezone=True), server_default=func.now())
