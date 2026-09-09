from typing import Any, List, Optional
from sqlalchemy.orm import Session
from app.models.college import Department, Course, Notice, FAQ
from app.schemas.college import (
    DepartmentCreate,
    CourseCreate,
    NoticeCreate,
    FAQCreate,
)

# Department CRUD
def get_departments(db: Session, skip: int = 0, limit: int = 100) -> List[Department]:
    return db.query(Department).offset(skip).limit(limit).all()

def create_department(db: Session, obj_in: DepartmentCreate) -> Department:
    db_obj = Department(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Course CRUD
def get_courses(db: Session, skip: int = 0, limit: int = 100) -> List[Course]:
    return db.query(Course).offset(skip).limit(limit).all()

def create_course(db: Session, obj_in: CourseCreate) -> Course:
    db_obj = Course(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# Notice CRUD
def get_notices(db: Session, skip: int = 0, limit: int = 100) -> List[Notice]:
    return db.query(Notice).offset(skip).limit(limit).all()

def create_notice(db: Session, obj_in: NoticeCreate) -> Notice:
    db_obj = Notice(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

# FAQ CRUD
def get_faqs(db: Session, skip: int = 0, limit: int = 100) -> List[FAQ]:
    return db.query(FAQ).offset(skip).limit(limit).all()

def create_faq(db: Session, obj_in: FAQCreate) -> FAQ:
    db_obj = FAQ(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
