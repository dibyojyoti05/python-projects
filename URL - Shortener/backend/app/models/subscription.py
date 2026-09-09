import uuid
from typing import Any
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declared_attr
from app.db.base_class import Base

class Subscription(Base):
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return "subscriptions"

    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Any = Column(UUID(as_uuid=True), ForeignKey("organization.id"), unique=True, nullable=False)
    tier: Any = Column(String, default="free") # free, pro, enterprise
    stripe_customer_id: Any = Column(String, nullable=True)
    stripe_subscription_id: Any = Column(String, nullable=True)
    current_period_end: Any = Column(DateTime(timezone=True), nullable=True)
    created_at: Any = Column(DateTime(timezone=True), server_default=func.now())
    updated_at: Any = Column(DateTime(timezone=True), onupdate=func.now())
