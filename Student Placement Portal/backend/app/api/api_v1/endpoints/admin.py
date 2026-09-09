from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.company import Company, RecruiterProfile
from app.models.student import StudentProfile
from app.models.job import Job
from app.models.application import Application

router = APIRouter()

class CompanyAdminOut(BaseModel):
    id: int
    name: str
    industry: Optional[str] = None
    website: Optional[str] = None
    headquarters: Optional[str] = None
    company_size: Optional[str] = None
    is_verified: bool
    jobs_count: int = 0
    recruiters_count: int = 0

    class Config:
        from_attributes = True

class UserAdminOut(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    name: Optional[str] = None
    department: Optional[str] = None

    class Config:
        from_attributes = True

class PlacementAnalyticsOut(BaseModel):
    total_students: int
    total_placed_students: int
    placement_rate: float
    total_companies: int
    total_jobs_posted: int
    total_applications: int
    branch_stats: List[dict]
    top_recruiters: List[dict]

# ----------------- Company Management -----------------

@router.get("/companies", response_model=List[CompanyAdminOut])
async def list_companies_admin(
    current_user: User = Depends(deps.RequireRole([RoleEnum.PLACEMENT_OFFICER, RoleEnum.SUPER_ADMIN])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(
        select(Company)
        .options(selectinload(Company.jobs), selectinload(Company.recruiters))
        .order_by(Company.id.desc())
    )
    companies = result.scalars().all()
    
    out = []
    for c in companies:
        out.append(CompanyAdminOut(
            id=c.id,
            name=c.name,
            industry=c.industry,
            website=c.website,
            headquarters=c.headquarters,
            company_size=c.company_size,
            is_verified=c.is_verified,
            jobs_count=len(c.jobs),
            recruiters_count=len(c.recruiters)
        ))
    return out

@router.patch("/companies/{company_id}/verify")
async def toggle_company_verification(
    company_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.PLACEMENT_OFFICER, RoleEnum.SUPER_ADMIN])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(Company).where(Company.id == company_id))
    company = result.scalars().first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    company.is_verified = not company.is_verified
    await db.commit()
    await db.refresh(company)
    status_str = "verified" if company.is_verified else "unverified"
    return {"message": f"Company '{company.name}' is now {status_str}", "is_verified": company.is_verified}

# ----------------- User Management -----------------

@router.get("/users", response_model=List[UserAdminOut])
async def list_users_admin(
    role: Optional[str] = None,
    current_user: User = Depends(deps.RequireRole([RoleEnum.PLACEMENT_OFFICER, RoleEnum.SUPER_ADMIN])),
    db: AsyncSession = Depends(deps.get_db)
):
    query = select(User).order_by(User.id.desc())
    if role:
        query = query.where(User.role == role)
    result = await db.execute(query)
    users = result.scalars().all()
    
    out = []
    for u in users:
        name = None
        dept = None
        if u.role == RoleEnum.STUDENT:
            sp = await db.execute(select(StudentProfile).where(StudentProfile.user_id == u.id))
            prof = sp.scalars().first()
            if prof:
                name = f"{prof.first_name or ''} {prof.last_name or ''}".strip() or None
                dept = prof.department
        elif u.role == RoleEnum.RECRUITER:
            rp = await db.execute(select(RecruiterProfile).where(RecruiterProfile.user_id == u.id))
            rec = rp.scalars().first()
            if rec:
                name = f"{rec.first_name or ''} {rec.last_name or ''}".strip() or None

        out.append(UserAdminOut(
            id=u.id,
            email=u.email,
            role=u.role.value if hasattr(u.role, 'value') else str(u.role),
            is_active=u.is_active,
            name=name,
            department=dept
        ))
    return out

@router.patch("/users/{user_id}/toggle-status")
async def toggle_user_active_status(
    user_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.SUPER_ADMIN])),
    db: AsyncSession = Depends(deps.get_db)
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot disable your own administrator account")
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    await db.commit()
    await db.refresh(user)
    return {"message": f"User {user.email} status updated", "is_active": user.is_active}

# ----------------- Placement Analytics -----------------

@router.get("/reports/analytics", response_model=PlacementAnalyticsOut)
async def get_placement_analytics(
    current_user: User = Depends(deps.RequireRole([RoleEnum.PLACEMENT_OFFICER, RoleEnum.SUPER_ADMIN])),
    db: AsyncSession = Depends(deps.get_db)
):
    # Total students
    total_students_res = await db.execute(select(func.count(StudentProfile.id)))
    total_students = total_students_res.scalar() or 0

    # Total placed students (Applications with status 'Accepted')
    placed_students_res = await db.execute(
        select(func.count(func.distinct(Application.student_id))).where(Application.status == "Accepted")
    )
    total_placed = placed_students_res.scalar() or 0

    # Total companies
    total_comp_res = await db.execute(select(func.count(Company.id)))
    total_companies = total_comp_res.scalar() or 0

    # Total jobs
    total_jobs_res = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_res.scalar() or 0

    # Total applications
    total_apps_res = await db.execute(select(func.count(Application.id)))
    total_apps = total_apps_res.scalar() or 0

    # Branch-wise stats
    dept_res = await db.execute(
        select(StudentProfile.department, func.count(StudentProfile.id))
        .where(StudentProfile.department.isnot(None))
        .group_by(StudentProfile.department)
    )
    branch_stats = []
    for dept, count in dept_res.all():
        # count placed in this branch
        placed_branch_res = await db.execute(
            select(func.count(func.distinct(Application.student_id)))
            .join(StudentProfile, Application.student_id == StudentProfile.id)
            .where(StudentProfile.department == dept, Application.status == "Accepted")
        )
        p_count = placed_branch_res.scalar() or 0
        pct = round((p_count / count) * 100, 1) if count > 0 else 0.0
        branch_stats.append({
            "department": dept,
            "total_students": count,
            "placed_students": p_count,
            "placement_rate": pct
        })

    # Top recruiters by jobs posted
    top_comp_res = await db.execute(
        select(Company.name, func.count(Job.id).label("job_count"))
        .join(Job, Company.id == Job.company_id)
        .group_by(Company.name)
        .order_by(func.count(Job.id).desc())
        .limit(5)
    )
    top_recruiters = [{"company": name, "jobs_posted": count} for name, count in top_comp_res.all()]

    placement_rate = round((total_placed / total_students) * 100, 1) if total_students > 0 else 0.0

    return PlacementAnalyticsOut(
        total_students=total_students,
        total_placed_students=total_placed,
        placement_rate=placement_rate,
        total_companies=total_companies,
        total_jobs_posted=total_jobs,
        total_applications=total_apps,
        branch_stats=branch_stats,
        top_recruiters=top_recruiters
    )
