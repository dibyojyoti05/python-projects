from sqlalchemy import Column, Integer, String, Boolean, Enum
from app.db.base_class import Base
import enum

class RoleEnum(str, enum.Enum):
    STUDENT = "STUDENT"
    RECRUITER = "RECRUITER"
    PLACEMENT_OFFICER = "PLACEMENT_OFFICER"
    SUPER_ADMIN = "SUPER_ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.STUDENT)
    is_active = Column(Boolean(), default=True)
