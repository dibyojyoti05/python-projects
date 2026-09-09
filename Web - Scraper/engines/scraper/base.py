from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class ScrapeRequest(BaseModel):
    url: str
    proxy: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    timeout: int = 30

class ScrapeResponse(BaseModel):
    url: str
    html: str
    status_code: int
    headers: Dict[str, str]

class BaseScraper(ABC):
    @abstractmethod
    async def scrape(self, request: ScrapeRequest) -> ScrapeResponse:
        pass
