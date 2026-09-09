import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Boolean, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

from typing import Any

class Link(Base):
    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id: Any = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    campaign_id: Any = Column(UUID(as_uuid=True), ForeignKey("campaign.id", ondelete="SET NULL"), nullable=True)
    domain_id: Any = Column(UUID(as_uuid=True), ForeignKey("domain.id", ondelete="SET NULL"), nullable=True)
    folder_id: Any = Column(UUID(as_uuid=True), ForeignKey("folder.id", ondelete="SET NULL"), nullable=True)
    created_by: Any = Column(UUID(as_uuid=True), ForeignKey("user.id", ondelete="SET NULL"), nullable=True)
    
    original_url: Any = Column(String, nullable=False)
    short_code: Any = Column(String, unique=True, index=True, nullable=False)
    custom_slug: Any = Column(String, unique=True, index=True, nullable=True)
    
    password_hash: Any = Column(String, nullable=True)
    expires_at: Any = Column(DateTime(timezone=True), nullable=True)
    activates_at: Any = Column(DateTime(timezone=True), nullable=True)
    click_limit: Any = Column(Integer, nullable=True)
    is_active: Any = Column(Boolean, default=True)
    is_favorite: Any = Column(Boolean, default=False)
    is_archived: Any = Column(Boolean, default=False)
    created_at: Any = Column(DateTime(timezone=True), default=func.now())
    
    # Advanced Routing: JSON maps, e.g., {"US": "https://us.example.com"}
    geo_routing: Any = Column(JSON, nullable=True)
    device_routing: Any = Column(JSON, nullable=True)
    os_routing: Any = Column(JSON, nullable=True)
    language_routing: Any = Column(JSON, nullable=True)
    
    organization = relationship("Organization", back_populates="links")
    campaign = relationship("Campaign", back_populates="links")
    domain = relationship("Domain")
    folder = relationship("Folder", back_populates="links")
    clicks = relationship("ClickEvent", back_populates="link")
    tags = relationship("Tag", secondary="linktag")
