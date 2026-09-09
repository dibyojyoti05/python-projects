from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.api import deps
from app.crud import crud_college

router = APIRouter()

# Departments
@router.get("/departments", response_model=List[schemas.college.Department])
def read_departments(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return crud_college.get_departments(db, skip=skip, limit=limit)

@router.post("/departments", response_model=schemas.college.Department)
def create_department(
    *,
    db: Session = Depends(deps.get_db),
    department_in: schemas.college.DepartmentCreate,
    current_user: schemas.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN"])),
) -> Any:
    return crud_college.create_department(db, obj_in=department_in)

# Courses
@router.get("/courses", response_model=List[schemas.college.Course])
def read_courses(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return crud_college.get_courses(db, skip=skip, limit=limit)

@router.post("/courses", response_model=schemas.college.Course)
def create_course(
    *,
    db: Session = Depends(deps.get_db),
    course_in: schemas.college.CourseCreate,
    current_user: schemas.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN"])),
) -> Any:
    return crud_college.create_course(db, obj_in=course_in)

# Notices
@router.get("/notices", response_model=List[schemas.college.Notice])
def read_notices(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return crud_college.get_notices(db, skip=skip, limit=limit)

@router.post("/notices", response_model=schemas.college.Notice)
def create_notice(
    *,
    db: Session = Depends(deps.get_db),
    notice_in: schemas.college.NoticeCreate,
    current_user: schemas.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN"])),
) -> Any:
    return crud_college.create_notice(db, obj_in=notice_in)

# FAQs
@router.get("/faqs", response_model=List[schemas.college.FAQ])
def read_faqs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return crud_college.get_faqs(db, skip=skip, limit=limit)

@router.post("/faqs", response_model=schemas.college.FAQ)
def create_faq(
    *,
    db: Session = Depends(deps.get_db),
    faq_in: schemas.college.FAQCreate,
    current_user: schemas.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN"])),
) -> Any:
    return crud_college.create_faq(db, obj_in=faq_in)
