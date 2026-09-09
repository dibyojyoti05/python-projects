import logging
from typing import List
from sqlalchemy.orm import Session
from app.schemas.job import JobCreate
from app.models.job import Job, JobSource
from app.services.scraping.base import JobSourceProvider
from fuzzywuzzy import fuzz

logger = logging.getLogger(__name__)

class ScrapingEngine:
    def __init__(self, db: Session, providers: List[JobSourceProvider]):
        self.db = db
        self.providers = providers

    def _get_or_create_source(self, name: str) -> JobSource:
        source = self.db.query(JobSource).filter(JobSource.name == name).first()
        if not source:
            source = JobSource(name=name, is_active=True)
            self.db.add(source)
            self.db.commit()
            self.db.refresh(source)
        return source

    def _is_duplicate(self, job_data: JobCreate) -> bool:
        # Exact URL or External ID match
        if job_data.external_job_id:
            exists = self.db.query(Job).filter(Job.external_job_id == job_data.external_job_id).first()
            if exists: return True
        
        exists = self.db.query(Job).filter(Job.source_url == job_data.source_url).first()
        if exists: return True

        # Fuzzy matching (fallback)
        recent_jobs = self.db.query(Job).filter(
            Job.company == job_data.company
        ).order_by(Job.created_at.desc()).limit(50).all()

        for rj in recent_jobs:
            if fuzz.ratio(rj.title.lower(), job_data.title.lower()) > 90:
                return True
                
        return False

    def run(self, keyword: str, location: str, limit_per_source: int = 10):
        total_saved = 0
        for provider in self.providers:
            try:
                logger.info(f"Fetching from {provider.source_name}")
                source_obj = self._get_or_create_source(provider.source_name)
                
                jobs = provider.fetch_jobs(keyword, location, limit=limit_per_source)
                for job_data in jobs:
                    job_data.source_id = source_obj.id
                    if not self._is_duplicate(job_data):
                        db_job = Job(**job_data.model_dump())
                        self.db.add(db_job)
                        total_saved += 1
                
                self.db.commit()
            except Exception as e:
                logger.error(f"Error scraping {provider.source_name}: {e}")
                self.db.rollback()
        
        return total_saved
