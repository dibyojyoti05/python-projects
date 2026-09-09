from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql import func
from datetime import datetime, timezone, timedelta

from backend.db.session import get_db
from backend.db.models import ScraperProject, ScrapeJob, ExtractedRecord
from backend.schemas.job import DashboardStats

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Returns aggregated metrics for the dashboard KPI cards.
    """
    # Total scrapers
    s_count = await db.scalar(select(func.count(ScraperProject.id))) or 0

    # Active running / pending jobs
    active_jobs = await db.scalar(
        select(func.count(ScrapeJob.id)).where(ScrapeJob.status.in_(["running", "pending"]))
    ) or 0

    # Completed jobs
    completed_jobs = await db.scalar(
        select(func.count(ScrapeJob.id)).where(ScrapeJob.status == "completed")
    ) or 0

    # Total jobs
    total_jobs = await db.scalar(select(func.count(ScrapeJob.id))) or 0

    # Pages scraped today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    pages_today = await db.scalar(
        select(func.coalesce(func.sum(ScrapeJob.total_pages), 0)).where(ScrapeJob.started_at >= today_start)
    ) or 0

    # Total records extracted
    total_records = await db.scalar(select(func.count(ExtractedRecord.id))) or 0

    # Success rate
    if total_jobs > 0:
        success_rate = round((completed_jobs / total_jobs) * 100, 1)
    else:
        success_rate = 100.0

    return DashboardStats(
        total_scrapers=s_count,
        active_jobs=active_jobs,
        completed_jobs=completed_jobs,
        pages_scraped_today=pages_today,
        extracted_records_total=total_records,
        success_rate=success_rate
    )
