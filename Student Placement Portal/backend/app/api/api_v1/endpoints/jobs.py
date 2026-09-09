from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.job import Job
from app.models.company import RecruiterProfile
from app.schemas.job import JobCreate, JobOut, JobUpdate

router = APIRouter()

def serialize_job(job: Job) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        description=job.description,
        requirements=job.requirements,
        location=job.location,
        salary_range=job.salary_range,
        job_type=job.job_type,
        is_active=job.is_active,
        deadline=job.deadline,
        min_cgpa=job.min_cgpa or 0.0,
        max_backlogs=job.max_backlogs or 0,
        eligible_branches=job.eligible_branches,
        created_at=job.created_at,
        company_id=job.company_id,
        company_name=job.company.name if job.company else None
    )

@router.get("", response_model=List[JobOut], include_in_schema=False)
@router.get("/", response_model=List[JobOut])
async def list_jobs(db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.company))
        .where(Job.is_active == True)
        .order_by(Job.id.desc())
    )
    jobs = result.scalars().all()
    return [serialize_job(j) for j in jobs]

@router.post("", response_model=JobOut, include_in_schema=False)
@router.post("/", response_model=JobOut)
async def create_job(

    job_in: JobCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    # Get recruiter's company
    result = await db.execute(
        select(RecruiterProfile)
        .options(selectinload(RecruiterProfile.company))
        .where(RecruiterProfile.user_id == current_user.id)
    )
    recruiter = result.scalars().first()
    if not recruiter or not recruiter.company_id:
        raise HTTPException(
            status_code=400,
            detail="Recruiter must be associated with a company to post jobs. Please setup your company profile first."
        )

    job = Job(**job_in.model_dump(), company_id=recruiter.company_id)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # Reload with company
    result = await db.execute(
        select(Job).options(selectinload(Job.company)).where(Job.id == job.id)
    )
    loaded_job = result.scalars().first()
    return serialize_job(loaded_job)

@router.get("/company/me", response_model=List[JobOut])
async def get_my_company_jobs(
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(RecruiterProfile).where(RecruiterProfile.user_id == current_user.id))
    recruiter = result.scalars().first()
    if not recruiter or not recruiter.company_id:
        return []
    
    result = await db.execute(
        select(Job)
        .options(selectinload(Job.company))
        .where(Job.company_id == recruiter.company_id)
        .order_by(Job.id.desc())
    )
    jobs = result.scalars().all()
    return [serialize_job(j) for j in jobs]

@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: int, db: AsyncSession = Depends(deps.get_db)):
    result = await db.execute(
        select(Job).options(selectinload(Job.company)).where(Job.id == job_id)
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return serialize_job(job)

@router.patch("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(RecruiterProfile).where(RecruiterProfile.user_id == current_user.id))
    recruiter = result.scalars().first()
    if not recruiter or not recruiter.company_id:
        raise HTTPException(status_code=400, detail="Recruiter must be associated with a company.")

    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    if job.company_id != recruiter.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this job")

    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)
        
    await db.commit()
    await db.refresh(job)
    
    result = await db.execute(
        select(Job).options(selectinload(Job.company)).where(Job.id == job.id)
    )
    return serialize_job(result.scalars().first())
