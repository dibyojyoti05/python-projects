from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.models.base import BaseModel

class Role(BaseModel):
    __tablename__ = "roles"
    
    name = Column(String, unique=True, index=True, nullable=False)
    
    users = relationship("User", back_populates="role")

class User(BaseModel):
    __tablename__ = "users"
    
    role_id = Column(ForeignKey("roles.id"))
    full_name = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    role = relationship("Role", back_populates="users")
    faces = relationship("Face", back_populates="user")
    attendance_records = relationship("Attendance", back_populates="user")
    recognition_logs = relationship("RecognitionLog", back_populates="user")
