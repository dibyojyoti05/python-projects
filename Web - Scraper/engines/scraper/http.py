import httpx
import random
from typing import Optional
from engines.scraper.base import BaseScraper, ScrapeRequest, ScrapeResponse

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
]

class HttpScraper(BaseScraper):
    def __init__(self):
        pass

    async def scrape(self, request: ScrapeRequest) -> ScrapeResponse:
        headers = request.headers or {}
        if "User-Agent" not in headers:
            headers["User-Agent"] = random.choice(USER_AGENTS)
            
        client_kwargs = {
            "verify": False,
            "timeout": request.timeout
        }
        if request.proxy:
            client_kwargs["proxy"] = request.proxy
            
        async with httpx.AsyncClient(**client_kwargs) as client:
            response = await client.get(
                request.url, 
                headers=headers, 
                follow_redirects=True
            )
            
            return ScrapeResponse(
                url=str(response.url),
                html=response.text,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
