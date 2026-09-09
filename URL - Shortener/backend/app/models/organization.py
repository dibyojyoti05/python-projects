import uuid
import re
from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

def generate_org_slug():
    return f"org-{uuid.uuid4().hex[:8]}"

class Organization(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, index=True, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False, default=generate_org_slug)
    billing_email = Column(String, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    
    users = relationship("OrganizationUser", back_populates="organization")
    links = relationship("Link", back_populates="organization")
    domains = relationship("Domain", back_populates="organization")

from typing import Any

class OrganizationUser(Base):
    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id: Any = Column(UUID(as_uuid=True), ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    organization_id: Any = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    role: Any = Column(String, default="MEMBER") # ADMIN, MEMBER, BILLING
    
    user = relationship("User")
    organization = relationship("Organization", back_populates="users")

class Domain(Base):
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organization.id", ondelete="CASCADE"), nullable=False)
    domain_name = Column(String, unique=True, index=True, nullable=False)
    is_verified = Column(Boolean, default=False)
    ssl_status = Column(String, default="pending") # pending, active, failed
    
    organization = relationship("Organization", back_populates="domains")

