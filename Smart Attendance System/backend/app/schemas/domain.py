from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "student"
    roll_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    class Config:
        from_attributes = True

# Subject/Class Schemas
class ClassRoomResponse(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True

class SubjectResponse(BaseModel):
    id: int
    name: str
    class_id: int
    teacher_id: Optional[int]
    class Config:
        from_attributes = True

# Attendance Schemas
class SessionCreate(BaseModel):
    subject_id: int

class SessionResponse(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    date: date
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str
    class Config:
        from_attributes = True

class RecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    timestamp: datetime
    method: str
    status: str
    class Config:
        from_attributes = True

# Camera payload schema
class FramePayload(BaseModel):
    image_base64: str

# New admin schemas
class RecordUpdate(BaseModel):
    status: str

class RecordCreateManual(BaseModel):
    session_id: int
    student_id: int
    status: str
    method: str = "manual"

# New student schema
class AttendanceStatsResponse(BaseModel):
    roll_number: str
    name: str
    total_sessions: int
    present_sessions: int
    attendance_percentage: float
    impact_message: str
    recent_records: List[RecordResponse]
