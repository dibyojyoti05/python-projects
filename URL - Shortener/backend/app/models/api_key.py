import uuid
from typing import Any
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declared_attr
from app.db.base_class import Base

class ApiKey(Base):
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return "api_keys"

    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Any = Column(String, nullable=False)
    key_hash: Any = Column(String, unique=True, index=True, nullable=False)
    key_prefix: Any = Column(String(32), nullable=False) # e.g. "lf_test_..." or "lf_prod_..."
    organization_id: Any = Column(UUID(as_uuid=True), ForeignKey("organization.id"), nullable=False)
    created_by: Any = Column(UUID(as_uuid=True), ForeignKey("user.id"), nullable=False)
    is_active: Any = Column(Boolean, default=True)
    last_used_at: Any = Column(DateTime(timezone=True), nullable=True)
    created_at: Any = Column(DateTime(timezone=True), server_default=func.now())
