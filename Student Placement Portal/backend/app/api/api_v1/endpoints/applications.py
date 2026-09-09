from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime, timezone

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.application import Application
from app.models.job import Job
from app.models.student import StudentProfile, Resume
from app.models.company import RecruiterProfile, Company
from app.models.notification import Notification
from app.schemas.application import ApplicationCreate, ApplicationOut, ApplicationUpdate

router = APIRouter()

def serialize_application(app: Application) -> ApplicationOut:
    student = app.student if app.student else None
    student_user = student.user if student and hasattr(student, "user") else None
    student_resumes = student.resumes if student and hasattr(student, "resumes") else []
    resume = student_resumes[0] if student_resumes else None
    
    job = app.job if app.job else None
    company = job.company if job and hasattr(job, "company") else None
    
    student_name = None
    if student:
        if student.first_name and student.last_name:
            student_name = f"{student.first_name} {student.last_name}"
        elif student.first_name:
            student_name = student.first_name

    return ApplicationOut(
        id=app.id,
        job_id=app.job_id,
        student_id=app.student_id,
        status=app.status,
        notes=app.notes,
        applied_at=app.applied_at,
        interview_date=app.interview_date,
        interview_link=app.interview_link,
        interview_round=app.interview_round,
        
        # Student details
        student_name=student_name,
        student_email=student_user.email if student_user else None,
        college=student.college if student else None,
        department=student.department if student else None,
        cgpa=student.cgpa if student else None,
        phone=student.phone if student else None,
        resume_id=resume.id if resume else None,
        resume_url=f"/api/v1/students/resume/{resume.id}" if resume else None,
        
        # Job details
        job_title=job.title if job else None,
        company_name=company.name if company else None,
        job_location=job.location if job else None,
        salary_range=job.salary_range if job else None,
    )

@router.post("", response_model=ApplicationOut, include_in_schema=False)
@router.post("/", response_model=ApplicationOut)
async def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.user), selectinload(StudentProfile.resumes))
        .where(StudentProfile.user_id == current_user.id)
    )
    student = result.scalars().first()
    if not student:
        raise HTTPException(status_code=400, detail="Student profile not found. Please complete your profile.")

    # Check if student has at least one uploaded resume
    if not student.resumes:
        raise HTTPException(status_code=400, detail="Please upload a resume in your profile before applying for jobs.")

    # Check if job exists
    result = await db.execute(
        select(Job).options(selectinload(Job.company)).where(Job.id == app_in.job_id)
    )
    job = result.scalars().first()
    if not job or not job.is_active:
        raise HTTPException(status_code=404, detail="Job not found or inactive")

    # 1. Check Deadline
    if job.deadline:
        now = datetime.now(timezone.utc)
        job_deadline = job.deadline if job.deadline.tzinfo else job.deadline.replace(tzinfo=timezone.utc)
        if now > job_deadline:
            raise HTTPException(status_code=400, detail="Application deadline for this job has passed.")

    # 2. Check CGPA eligibility
    if job.min_cgpa and job.min_cgpa > 0.0:
        student_cgpa = student.cgpa or 0.0
        if student_cgpa < job.min_cgpa:
            raise HTTPException(
                status_code=400,
                detail=f"Eligibility check failed: Minimum required CGPA is {job.min_cgpa} (Your CGPA: {student_cgpa})."
            )

    # 3. Check Backlogs eligibility
    if job.max_backlogs is not None:
        student_backlogs = student.backlogs or 0
        if student_backlogs > job.max_backlogs:
            raise HTTPException(
                status_code=400,
                detail=f"Eligibility check failed: Job allows maximum {job.max_backlogs} backlogs (You have {student_backlogs})."
            )

    # 4. Check Branch/Department eligibility
    if job.eligible_branches and job.eligible_branches.strip():
        allowed_branches = [b.strip().lower() for b in job.eligible_branches.split(",")]
        student_dept = (student.department or "").strip().lower()
        if student_dept not in allowed_branches:
            raise HTTPException(
                status_code=400,
                detail=f"Eligibility check failed: Open only to [{job.eligible_branches}] (Your department: {student.department or 'Not Specified'})."
            )

    # Check if already applied
    result = await db.execute(
        select(Application)
        .where(Application.job_id == app_in.job_id)
        .where(Application.student_id == student.id)
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="You have already applied to this job.")

    application = Application(job_id=app_in.job_id, student_id=student.id)
    db.add(application)
    
    # Notify student of successful application submission
    company_name = job.company.name if job.company else "the recruiter"
    student_notif = Notification(
        user_id=current_user.id,
        title=f"Application Submitted: {job.title}",
        message=f"Your application for {job.title} at {company_name} has been successfully submitted.",
        link="/applications"
    )
    db.add(student_notif)

    await db.commit()
    await db.refresh(application)
    
    # Reload with relationships
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.company),
            selectinload(Application.student).selectinload(StudentProfile.user),
            selectinload(Application.student).selectinload(StudentProfile.resumes)
        )
        .where(Application.id == application.id)
    )
    loaded_app = result.scalars().first()
    return serialize_application(loaded_app)

@router.get("/me", response_model=List[ApplicationOut])
async def my_applications(
    current_user: User = Depends(deps.RequireRole([RoleEnum.STUDENT])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(StudentProfile).where(StudentProfile.user_id == current_user.id))
    student = result.scalars().first()
    if not student:
        return []
    
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.company),
            selectinload(Application.student).selectinload(StudentProfile.user),
            selectinload(Application.student).selectinload(StudentProfile.resumes)
        )
        .where(Application.student_id == student.id)
        .order_by(Application.id.desc())
    )
    apps = result.scalars().all()
    return [serialize_application(a) for a in apps]

@router.get("/job/{job_id}", response_model=List[ApplicationOut])
async def get_job_applications(
    job_id: int,
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    # Verify recruiter owns the job
    result = await db.execute(select(RecruiterProfile).where(RecruiterProfile.user_id == current_user.id))
    recruiter = result.scalars().first()
    if not recruiter:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalars().first()
    if not job or job.company_id != recruiter.company_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")

    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.company),
            selectinload(Application.student).selectinload(StudentProfile.user),
            selectinload(Application.student).selectinload(StudentProfile.resumes)
        )
        .where(Application.job_id == job_id)
        .order_by(Application.id.desc())
    )
    apps = result.scalars().all()
    return [serialize_application(a) for a in apps]

@router.patch("/{app_id}/status", response_model=ApplicationOut)
async def update_application_status(
    app_id: int,
    app_update: ApplicationUpdate,
    current_user: User = Depends(deps.RequireRole([RoleEnum.RECRUITER])),
    db: AsyncSession = Depends(deps.get_db)
):
    result = await db.execute(select(RecruiterProfile).where(RecruiterProfile.user_id == current_user.id))
    recruiter = result.scalars().first()
    
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.job).selectinload(Job.company),
            selectinload(Application.student).selectinload(StudentProfile.user),
            selectinload(Application.student).selectinload(StudentProfile.resumes)
        )
        .where(Application.id == app_id)
    )
    application = result.scalars().first()
    
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
        
    if not recruiter or application.job.company_id != recruiter.company_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    old_status = application.status
    if app_update.status:
        application.status = app_update.status
    if app_update.notes:
        application.notes = app_update.notes
    if app_update.interview_date is not None:
        application.interview_date = app_update.interview_date
    if app_update.interview_link is not None:
        application.interview_link = app_update.interview_link
    if app_update.interview_round is not None:
        application.interview_round = app_update.interview_round

    # Create notification for the student
    job_title = application.job.title if application.job else "Job"
    company_name = application.job.company.name if application.job and application.job.company else "Recruiter"
    
    if application.student and application.student.user_id:
        notif_msg = f"Your application for '{job_title}' at {company_name} status was updated to: {application.status}."
        if app_update.interview_date:
            formatted_date = app_update.interview_date.strftime("%b %d, %Y at %I:%M %p")
            notif_msg += f" Interview round '{app_update.interview_round or 'Round'}' scheduled for {formatted_date}."
            if app_update.interview_link:
                notif_msg += f" Meeting link: {app_update.interview_link}"
                
        notif = Notification(
            user_id=application.student.user_id,
            title=f"Application Update: {job_title}",
            message=notif_msg,
            link="/applications"
        )
        db.add(notif)
        
    await db.commit()
    await db.refresh(application)
    return serialize_application(application)
