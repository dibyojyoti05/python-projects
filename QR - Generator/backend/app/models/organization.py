import uuid
from typing import TYPE_CHECKING, List, Optional, Any
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, func, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base
from app.models.user import UserRole

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.qr_code import QRCode
    from app.models.user import User

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    billing_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    # Relationships
    members: Mapped[List["OrganizationMember"]] = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    campaigns: Mapped[List["Campaign"]] = relationship("Campaign", back_populates="organization", cascade="all, delete-orphan")
    qr_codes: Mapped[List["QRCode"]] = relationship("QRCode", back_populates="organization", cascade="all, delete-orphan")

    def __init__(
        self,
        name: str = "",
        id: Optional[uuid.UUID] = None,
        billing_email: Optional[str] = None,
        stripe_customer_id: Optional[str] = None,
        **kwargs: Any
    ):
        super().__init__(
            id=id or uuid.uuid4(),
            name=name,
            billing_email=billing_email,
            stripe_customer_id=stripe_customer_id,
            **kwargs
        )

class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.MEMBER)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    organization: Mapped["Organization"] = relationship("Organization", back_populates="members")
    user: Mapped["User"] = relationship("User", back_populates="organizations")

    def __init__(
        self,
        organization_id: Optional[uuid.UUID] = None,
        user_id: Optional[uuid.UUID] = None,
        role: UserRole = UserRole.MEMBER,
        id: Optional[uuid.UUID] = None,
        **kwargs: Any
    ):
        super().__init__(
            id=id or uuid.uuid4(),
            organization_id=organization_id,
            user_id=user_id,
            role=role,
            **kwargs
        )
