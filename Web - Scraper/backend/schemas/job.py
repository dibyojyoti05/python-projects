from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class JobResponse(BaseModel):
    id: str
    scraper_id: str
    scraper_name: Optional[str] = None
    status: str
    total_pages: int
    extracted_records_count: int
    error_message: Optional[str] = None
    duration_ms: int
    started_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class ExtractedRecordResponse(BaseModel):
    id: str
    job_id: str
    scraper_id: str
    source_url: str
    data: Dict[str, Any]
    crawled_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_scrapers: int
    active_jobs: int
    completed_jobs: int
    pages_scraped_today: int
    extracted_records_total: int
    success_rate: float
