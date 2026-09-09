from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, Dict, Any

from app.api import deps
from app.models.user import User, RoleEnum
from app.models.application import Application
from app.models.job import Job
from app.models.student import StudentProfile
from app.models.company import RecruiterProfile

router = APIRouter()

class DashboardStats(BaseModel):
    role: str
    metrics: Dict[str, Any]

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(deps.get_db)
):
    if current_user.role == RoleEnum.STUDENT:
        # Student metrics
        profile_res = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == current_user.id)
        )
        profile = profile_res.scalars().first()
        student_id = profile.id if profile else None

        total_apps = 0
        shortlisted = 0
        accepted = 0
        pending = 0

        if student_id:
            apps_res = await db.execute(
                select(Application).where(Application.student_id == student_id)
            )
            apps = apps_res.scalars().all()
            total_apps = len(apps)
            shortlisted = sum(1 for a in apps if a.status.lower() == "shortlisted")
            accepted = sum(1 for a in apps if a.status.lower() == "accepted")
            pending = sum(1 for a in apps if a.status.lower() == "pending")

        jobs_count_res = await db.execute(
            select(func.count(Job.id)).where(Job.is_active == True)
        )
        total_active_jobs = jobs_count_res.scalar() or 0

        profile_complete = bool(profile and profile.college and profile.department and profile.cgpa)

        return DashboardStats(
            role=current_user.role.value,
            metrics={
                "total_applications": total_apps,
                "shortlisted": shortlisted,
                "accepted": accepted,
                "pending": pending,
                "total_active_jobs": total_active_jobs,
                "profile_complete": profile_complete,
                "student_name": f"{profile.first_name} {profile.last_name}" if (profile and profile.first_name) else current_user.email
            }
        )

    elif current_user.role == RoleEnum.RECRUITER:
        # Recruiter metrics
        rec_res = await db.execute(
            select(RecruiterProfile).where(RecruiterProfile.user_id == current_user.id)
        )
        recruiter = rec_res.scalars().first()
        company_id = recruiter.company_id if recruiter else None

        if not company_id:
            return DashboardStats(
                role=current_user.role.value,
                metrics={
                    "company_setup_required": True,
                    "total_jobs": 0,
                    "total_applicants": 0,
                    "pending_reviews": 0,
                    "shortlisted": 0
                }
            )

        jobs_res = await db.execute(
            select(Job.id).where(Job.company_id == company_id)
        )
        job_ids = [r[0] for r in jobs_res.fetchall()]

        total_applicants = 0
        pending_reviews = 0
        shortlisted = 0

        if job_ids:
            apps_res = await db.execute(
                select(Application).where(Application.job_id.in_(job_ids))
            )
            apps = apps_res.scalars().all()
            total_applicants = len(apps)
            pending_reviews = sum(1 for a in apps if a.status.lower() == "pending")
            shortlisted = sum(1 for a in apps if a.status.lower() == "shortlisted")

        return DashboardStats(
            role=current_user.role.value,
            metrics={
                "company_setup_required": False,
                "total_jobs": len(job_ids),
                "total_applicants": total_applicants,
                "pending_reviews": pending_reviews,
                "shortlisted": shortlisted,
                "recruiter_name": f"{recruiter.first_name} {recruiter.last_name}" if (recruiter and recruiter.first_name) else current_user.email
            }
        )

    else:
        # Admin / Other
        users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
        jobs_count = (await db.execute(select(func.count(Job.id)))).scalar() or 0
        apps_count = (await db.execute(select(func.count(Application.id)))).scalar() or 0

        return DashboardStats(
            role=current_user.role.value,
            metrics={
                "total_users": users_count,
                "total_jobs": jobs_count,
                "total_applications": apps_count
            }
        )
