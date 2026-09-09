import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

from typing import Any

class ClickEvent(Base):
    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    link_id: Any = Column(UUID(as_uuid=True), ForeignKey("link.id", ondelete="CASCADE"), nullable=False)
    
    ip_address: Any = Column(String, nullable=True) # Anonymized or raw based on privacy settings
    country: Any = Column(String, index=True, nullable=True)
    city: Any = Column(String, nullable=True)
    device_type: Any = Column(String, index=True, nullable=True)
    browser: Any = Column(String, index=True, nullable=True)
    os: Any = Column(String, index=True, nullable=True)
    referrer: Any = Column(String, index=True, nullable=True)
    
    # Optional GPS
    latitude: Any = Column(String, nullable=True)
    longitude: Any = Column(String, nullable=True)
    
    link = relationship("Link", back_populates="clicks")
