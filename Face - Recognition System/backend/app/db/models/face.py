from sqlalchemy import Column, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class Face(BaseModel):
    __tablename__ = "faces"
    
    user_id = Column(ForeignKey("users.id"), nullable=False)
    embedding = Column(Text, nullable=False) # JSON string or array of floats depending on dialect
    image_path = Column(String, nullable=False)
    is_primary = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="faces")
