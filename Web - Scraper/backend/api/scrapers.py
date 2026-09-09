from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from backend.db.session import get_db
from backend.db.models import ScraperProject, ScrapeJob
from backend.schemas.scraper import ScraperCreate, ScraperUpdate, ScraperResponse

router = APIRouter()

@router.get("/", response_model=List[ScraperResponse])
async def list_scrapers(db: AsyncSession = Depends(get_db)):
    """
    List all scraper projects with their latest job status and job counts.
    """
    result = await db.execute(
        select(ScraperProject)
        .options(selectinload(ScraperProject.jobs))
        .order_by(ScraperProject.created_at.desc())
    )
    scrapers = result.scalars().all()

    responses = []
    for s in scrapers:
        latest_job = s.jobs[0] if s.jobs else None
        resp = ScraperResponse(
            id=s.id,
            name=s.name,
            description=s.description,
            start_url=s.start_url,
            scraper_type=s.scraper_type,
            max_depth=s.max_depth,
            proxy=s.proxy,
            headers=s.headers or {},
            extraction_schema=s.extraction_schema or {},
            is_active=s.is_active,
            created_at=s.created_at,
            updated_at=s.updated_at,
            total_jobs=len(s.jobs),
            latest_job_status=latest_job.status if latest_job else "never_run"
        )
        responses.append(resp)
    return responses

@router.post("/", response_model=ScraperResponse, status_code=status.HTTP_201_CREATED)
async def create_scraper(scraper_in: ScraperCreate, db: AsyncSession = Depends(get_db)):
    """
    Create a new scraping project.
    """
    scraper = ScraperProject(
        name=scraper_in.name,
        description=scraper_in.description,
        start_url=scraper_in.start_url,
        scraper_type=scraper_in.scraper_type,
        max_depth=scraper_in.max_depth,
        proxy=scraper_in.proxy,
        headers=scraper_in.headers or {},
        extraction_schema=scraper_in.extraction_schema or {},
        is_active=scraper_in.is_active
    )
    db.add(scraper)
    await db.commit()
    await db.refresh(scraper)

    return ScraperResponse(
        id=scraper.id,
        name=scraper.name,
        description=scraper.description,
        start_url=scraper.start_url,
        scraper_type=scraper.scraper_type,
        max_depth=scraper.max_depth,
        proxy=scraper.proxy,
        headers=scraper.headers or {},
        extraction_schema=scraper.extraction_schema or {},
        is_active=scraper.is_active,
        created_at=scraper.created_at,
        updated_at=scraper.updated_at,
        total_jobs=0,
        latest_job_status="never_run"
    )

@router.get("/{scraper_id}", response_model=ScraperResponse)
async def get_scraper(scraper_id: str, db: AsyncSession = Depends(get_db)):
    """
    Get details of a specific scraper project.
    """
    result = await db.execute(
        select(ScraperProject)
        .options(selectinload(ScraperProject.jobs))
        .where(ScraperProject.id == scraper_id)
    )
    scraper = result.scalars().first()
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper project not found")

    latest_job = scraper.jobs[0] if scraper.jobs else None
    return ScraperResponse(
        id=scraper.id,
        name=scraper.name,
        description=scraper.description,
        start_url=scraper.start_url,
        scraper_type=scraper.scraper_type,
        max_depth=scraper.max_depth,
        proxy=scraper.proxy,
        headers=scraper.headers or {},
        extraction_schema=scraper.extraction_schema or {},
        is_active=scraper.is_active,
        created_at=scraper.created_at,
        updated_at=scraper.updated_at,
        total_jobs=len(scraper.jobs),
        latest_job_status=latest_job.status if latest_job else "never_run"
    )

@router.put("/{scraper_id}", response_model=ScraperResponse)
async def update_scraper(scraper_id: str, scraper_in: ScraperUpdate, db: AsyncSession = Depends(get_db)):
    """
    Update an existing scraper project.
    """
    result = await db.execute(
        select(ScraperProject)
        .options(selectinload(ScraperProject.jobs))
        .where(ScraperProject.id == scraper_id)
    )
    scraper = result.scalars().first()
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper project not found")

    for field, value in scraper_in.model_dump(exclude_unset=True).items():
        setattr(scraper, field, value)

    await db.commit()
    await db.refresh(scraper)

    latest_job = scraper.jobs[0] if scraper.jobs else None
    return ScraperResponse(
        id=scraper.id,
        name=scraper.name,
        description=scraper.description,
        start_url=scraper.start_url,
        scraper_type=scraper.scraper_type,
        max_depth=scraper.max_depth,
        proxy=scraper.proxy,
        headers=scraper.headers or {},
        extraction_schema=scraper.extraction_schema or {},
        is_active=scraper.is_active,
        created_at=scraper.created_at,
        updated_at=scraper.updated_at,
        total_jobs=len(scraper.jobs),
        latest_job_status=latest_job.status if latest_job else "never_run"
    )

@router.delete("/{scraper_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scraper(scraper_id: str, db: AsyncSession = Depends(get_db)):
    """
    Delete a scraper project and its associated history.
    """
    result = await db.execute(select(ScraperProject).where(ScraperProject.id == scraper_id))
    scraper = result.scalars().first()
    if not scraper:
        raise HTTPException(status_code=404, detail="Scraper project not found")

    await db.delete(scraper)
    await db.commit()
    return None
