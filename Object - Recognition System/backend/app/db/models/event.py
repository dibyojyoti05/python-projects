from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class DetectionEvent(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id", ondelete="CASCADE"), index=True, nullable=False)
    
    object_class = Column(String(100), index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    tracking_id = Column(String(100), index=True)
    
    # Bounding box coords (x, y, w, h) could be stored as JSON or string.
    # For performance and simple querying, standard strings or separate floats can be used.
    bounding_box = Column(String(255))
    
    snapshot_path = Column(String(1024))
    zone_name = Column(String(100))
    duration_seconds = Column(Float, default=0.0)

    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    camera = relationship("Camera", backref="events")
