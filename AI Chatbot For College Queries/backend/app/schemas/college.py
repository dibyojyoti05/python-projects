from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class Department(DepartmentBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    name: str
    department_id: Optional[int] = None
    duration: Optional[str] = None
    eligibility: Optional[str] = None
    degree: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class Course(CourseBase):
    id: int
    class Config:
        from_attributes = True

class FAQBase(BaseModel):
    question: str
    answer: str
    category: Optional[str] = None
    is_published: bool = True
    priority: int = 0

class FAQCreate(FAQBase):
    pass

class FAQ(FAQBase):
    id: int
    class Config:
        from_attributes = True

class NoticeBase(BaseModel):
    title: str
    description: Optional[str] = None
    department_id: Optional[int] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class NoticeCreate(NoticeBase):
    pass

class Notice(NoticeBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
