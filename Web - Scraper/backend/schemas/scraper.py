from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class ScraperBase(BaseModel):
    name: str = Field(..., description="Project name")
    description: Optional[str] = Field(None, description="Project description")
    start_url: str = Field(..., description="Target seed URL")
    scraper_type: str = Field("http", description="Engine: http, playwright, or crawler")
    max_depth: int = Field(1, description="Crawl depth (1 for single page)")
    proxy: Optional[str] = Field(None, description="Optional HTTP/HTTPS proxy")
    headers: Optional[Dict[str, str]] = Field(default_factory=dict, description="Custom HTTP headers")
    extraction_schema: Dict[str, Any] = Field(default_factory=dict, description="Fields to CSS/XPath selectors mapping")
    is_active: bool = True

class ScraperCreate(ScraperBase):
    pass

class ScraperUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_url: Optional[str] = None
    scraper_type: Optional[str] = None
    max_depth: Optional[int] = None
    proxy: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    extraction_schema: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None

class ScraperResponse(ScraperBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    total_jobs: int = 0
    latest_job_status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
