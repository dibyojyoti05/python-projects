from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Optional, Any
from datetime import datetime
from sqlalchemy import String, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.qr_code import QRCode

class Scan(Base):
    __tablename__ = "scans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    qr_code_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("qr_codes.id", ondelete="CASCADE"), index=True, nullable=False)
    
    # Analytics data
    ip_address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    country: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    browser: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    os: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String, index=True, nullable=True)
    referrer: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # UTM Parameters tracking
    utm_source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    utm_medium: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    utm_campaign: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Raw headers for deeper analysis if needed
    raw_user_agent: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    scanned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationships
    qr_code: Mapped["QRCode"] = relationship("QRCode", back_populates="scans")

    def __init__(
        self,
        qr_code_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        country: Optional[str] = None,
        city: Optional[str] = None,
        browser: Optional[str] = None,
        os: Optional[str] = None,
        device_type: Optional[str] = None,
        referrer: Optional[str] = None,
        utm_source: Optional[str] = None,
        utm_medium: Optional[str] = None,
        utm_campaign: Optional[str] = None,
        raw_user_agent: Optional[str] = None,
        id: Optional[uuid.UUID] = None,
        **kwargs: Any
    ):
        super().__init__(
            id=id or uuid.uuid4(),
            qr_code_id=qr_code_id,
            ip_address=ip_address,
            country=country,
            city=city,
            browser=browser,
            os=os,
            device_type=device_type,
            referrer=referrer,
            utm_source=utm_source,
            utm_medium=utm_medium,
            utm_campaign=utm_campaign,
            raw_user_agent=raw_user_agent,
            **kwargs
        )
