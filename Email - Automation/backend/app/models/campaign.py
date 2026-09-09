import uuid
import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func, ForeignKey, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base_class import Base
from app.db.types import UUIDType

class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    COMPLETED = "completed"
    FAILED = "failed"
    ARCHIVED = "archived"

class Campaign(Base):
    id: Mapped[uuid.UUID] = mapped_column(UUIDType, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUIDType, ForeignKey("user.id", ondelete="CASCADE"), index=True)
    provider_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUIDType, ForeignKey("email_provider.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    content_html: Mapped[str] = mapped_column(String, nullable=False)
    content_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.DRAFT)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

