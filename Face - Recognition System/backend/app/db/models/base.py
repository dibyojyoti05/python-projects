import uuid
from sqlalchemy import Column, DateTime, func, Uuid

from app.db.database import Base

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
