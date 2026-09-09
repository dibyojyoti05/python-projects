from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from engines.scraper.base import ScrapeRequest, ScrapeResponse
from engines.scraper.http import HttpScraper
from engines.browser.playwright_scraper import PlaywrightScraper

router = APIRouter()

class ScrapeJobRequest(BaseModel):
    url: str
    use_browser: bool = False
    proxy: Optional[str] = None
    timeout: int = 30

@router.post("/execute", response_model=ScrapeResponse)
async def execute_scrape(request: ScrapeJobRequest):
    """
    Execute a synchronous scrape request.
    """
    scrape_req = ScrapeRequest(
        url=request.url,
        proxy=request.proxy,
        timeout=request.timeout
    )
    
    try:
        if request.use_browser:
            scraper = PlaywrightScraper()
        else:
            scraper = HttpScraper()
            
        response = await scraper.scrape(scrape_req)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
