import uuid
import enum
from typing import TYPE_CHECKING, List, Optional, Any, Dict
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.campaign import Campaign
    from app.models.scan import Scan

class QRCodeType(str, enum.Enum):
    URL = "URL"
    TEXT = "TEXT"
    WIFI = "WIFI"
    EMAIL = "EMAIL"
    SMS = "SMS"
    PHONE = "PHONE"
    WHATSAPP = "WHATSAPP"
    TELEGRAM = "TELEGRAM"
    LOCATION = "LOCATION"
    VCARD = "VCARD"
    CALENDAR = "CALENDAR"
    CRYPTO = "CRYPTO"
    UPI = "UPI"
    PAYPAL = "PAYPAL"
    SOCIAL = "SOCIAL"
    APP = "APP"
    CUSTOM = "CUSTOM"

class QRCode(Base):
    __tablename__ = "qr_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    campaign_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    is_dynamic: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    qr_type: Mapped[QRCodeType] = mapped_column(Enum(QRCodeType), nullable=False)
    
    # The actual data (for static, it's what's encoded; for dynamic, it's the destination)
    destination_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    raw_data: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Short code for dynamic routing
    short_code: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    
    # Customization JSON (colors, logos, shapes, etc)
    customization: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict)
    
    # Generated Asset paths
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Dynamic settings
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    scan_limit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="qr_codes")
    campaign: Mapped["Campaign"] = relationship("Campaign", back_populates="qr_codes")
    scans: Mapped[List["Scan"]] = relationship("Scan", back_populates="qr_code", cascade="all, delete-orphan")

    def __init__(
        self,
        name: str = "",
        organization_id: Optional[uuid.UUID] = None,
        qr_type: QRCodeType = QRCodeType.URL,
        id: Optional[uuid.UUID] = None,
        campaign_id: Optional[uuid.UUID] = None,
        is_dynamic: bool = True,
        destination_url: Optional[str] = None,
        raw_data: Optional[str] = None,
        short_code: Optional[str] = None,
        customization: Optional[Dict[str, Any]] = None,
        image_url: Optional[str] = None,
        is_active: bool = True,
        password_hash: Optional[str] = None,
        expires_at: Optional[datetime] = None,
        scan_limit: Optional[int] = None,
        **kwargs: Any
    ):
        super().__init__(
            id=id or uuid.uuid4(),
            organization_id=organization_id,
            campaign_id=campaign_id,
            name=name,
            is_dynamic=is_dynamic,
            qr_type=qr_type,
            destination_url=destination_url,
            raw_data=raw_data,
            short_code=short_code,
            customization=customization or {},
            image_url=image_url,
            is_active=is_active,
            password_hash=password_hash,
            expires_at=expires_at,
            scan_limit=scan_limit,
            **kwargs
        )
