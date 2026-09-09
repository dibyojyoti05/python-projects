import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from backend.db.session import get_db
from backend.db.models import ScraperProject, ScrapeJob, ExtractedRecord
from backend.schemas.job import JobResponse, ExtractedRecordResponse
from backend.services.scraper_service import run_scraper_job
from backend.services.export_service import generate_export_data

router = APIRouter()

@router.post("/{scraper_id}/run", response_model=JobResponse)
async def trigger_scrape_job(
    scraper_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers an immediate background scrape job for the specified scraper.
    """
    result = await db.execute(select(ScraperProject).where(ScraperProject.id == scraper_id))
    scraper = result.scalars().first()
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper project not found")

    job = ScrapeJob(
        scraper_id=scraper.id,
        status="pending"
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    # Launch in-process background worker task
    background_tasks.add_task(run_scraper_job, job.id)

    return JobResponse(
        id=job.id,
        scraper_id=job.scraper_id,
        scraper_name=scraper.name,
        status=job.status,
        total_pages=job.total_pages,
        extracted_records_count=job.extracted_records_count,
        error_message=job.error_message,
        duration_ms=job.duration_ms,
        started_at=job.started_at,
        completed_at=job.completed_at
    )

@router.get("/", response_model=List[JobResponse])
async def list_jobs(limit: int = 50, db: AsyncSession = Depends(get_db)):
    """
    List recent scrape jobs across all projects.
    """
    result = await db.execute(
        select(ScrapeJob)
        .options(selectinload(ScrapeJob.scraper))
        .order_by(ScrapeJob.started_at.desc())
        .limit(limit)
    )
    jobs = result.scalars().all()

    return [
        JobResponse(
            id=j.id,
            scraper_id=j.scraper_id,
            scraper_name=j.scraper.name if j.scraper else "Unknown",
            status=j.status,
            total_pages=j.total_pages,
            extracted_records_count=j.extracted_records_count,
            error_message=j.error_message,
            duration_ms=j.duration_ms,
            started_at=j.started_at,
            completed_at=j.completed_at
        )
        for j in jobs
    ]

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve status and metrics of a specific job.
    """
    result = await db.execute(
        select(ScrapeJob)
        .options(selectinload(ScrapeJob.scraper))
        .where(ScrapeJob.id == job_id)
    )
    job = result.scalars().first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(
        id=job.id,
        scraper_id=job.scraper_id,
        scraper_name=job.scraper.name if job.scraper else "Unknown",
        status=job.status,
        total_pages=job.total_pages,
        extracted_records_count=job.extracted_records_count,
        error_message=job.error_message,
        duration_ms=job.duration_ms,
        started_at=job.started_at,
        completed_at=job.completed_at
    )

@router.get("/{job_id}/records", response_model=List[ExtractedRecordResponse])
async def get_job_records(job_id: str, limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Get paginated extracted records for a completed job.
    """
    result = await db.execute(
        select(ExtractedRecord)
        .where(ExtractedRecord.job_id == job_id)
        .order_by(ExtractedRecord.crawled_at.asc())
        .limit(limit)
    )
    records = result.scalars().all()
    return records

@router.get("/{job_id}/export")
async def export_job_data_endpoint(
    job_id: str,
    format: str = Query("csv", pattern="^(csv|json)$")
):
    """
    Downloads extracted records as CSV or JSON file.
    """
    content, media_type, filename = await generate_export_data(job_id, format)
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
