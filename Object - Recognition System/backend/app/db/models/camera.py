from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base_class import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    location = Column(String(255))
    rtsp_url = Column(String(1024), nullable=False)
    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=False)
    ai_enabled = Column(Boolean, default=True)
    
    # JSON field for zones / lines could go here, but keeping it simple for now
    # detection_zones = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
