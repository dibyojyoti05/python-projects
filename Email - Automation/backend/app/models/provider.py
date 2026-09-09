import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Boolean, DateTime, func, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base
from app.db.types import UUIDType, JSONType

class EmailProvider(Base):
    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("user.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "SendGrid", "SES", "Custom SMTP"
    provider_type: Mapped[str] = mapped_column(String(50), nullable=False) # smtp, api
    credentials: Mapped[dict] = mapped_column(JSONType, nullable=False) # Encrypted or secure store of credentials
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    health_status: Mapped[str] = mapped_column(String(50), default="unknown") # healthy, failing
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

