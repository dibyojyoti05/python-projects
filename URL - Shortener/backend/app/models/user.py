from typing import Any
import uuid
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"

class User(Base):
    id: Any = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email: Any = Column(String, unique=True, index=True, nullable=False)
    hashed_password: Any = Column(String, nullable=True)  # Nullable for OAuth users
    full_name: Any = Column(String, index=True)
    is_active: Any = Column(Boolean(), default=True)
    is_superuser: Any = Column(Boolean(), default=False)
    role: Any = Column(Enum(UserRole), default=UserRole.VIEWER)
    
    # OAuth providers
    google_id: Any = Column(String, unique=True, index=True, nullable=True)
    github_id: Any = Column(String, unique=True, index=True, nullable=True)
