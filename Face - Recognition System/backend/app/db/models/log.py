from sqlalchemy import Column, String, Float, Boolean, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class RecognitionLog(BaseModel):
    __tablename__ = "recognition_logs"
    
    camera_id = Column(ForeignKey("cameras.id"), nullable=False)
    user_id = Column(ForeignKey("users.id"), nullable=True) # Nullable for unknown
    image_snapshot_path = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=True)
    is_unknown = Column(Boolean, default=False)
    liveness_passed = Column(Boolean, default=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    camera = relationship("Camera", back_populates="logs")
    user = relationship("User", back_populates="recognition_logs")
