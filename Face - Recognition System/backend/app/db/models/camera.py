from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class Camera(BaseModel):
    __tablename__ = "cameras"
    
    name = Column(String, index=True, nullable=False)
    location = Column(String, nullable=True)
    rtsp_url = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    health_status = Column(String, default="Online")
    last_ping = Column(DateTime(timezone=True), nullable=True)
    
    logs = relationship("RecognitionLog", back_populates="camera")
