import logging
import random
from typing import Optional
from engines.scraper.base import BaseScraper, ScrapeRequest, ScrapeResponse
from engines.scraper.http import HttpScraper

logger = logging.getLogger(__name__)

class PlaywrightScraper(BaseScraper):
    async def scrape(self, request: ScrapeRequest) -> ScrapeResponse:
        try:
            from playwright.async_api import async_playwright, ProxySettings
            
            async with async_playwright() as p:
                proxy_settings = None
                if request.proxy:
                    proxy_settings = ProxySettings(server=request.proxy)
                
                browser = await p.chromium.launch(
                    headless=True,
                    proxy=proxy_settings,
                    args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
                )
                
                context_args = {
                    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    "viewport": {"width": 1280, "height": 800}
                }
                if request.headers and "User-Agent" in request.headers:
                    context_args["user_agent"] = request.headers["User-Agent"]
                
                context = await browser.new_context(**context_args)
                
                if request.headers:
                    extra_headers = {k: str(v) for k, v in request.headers.items() if k.lower() != "user-agent"}
                    if extra_headers:
                        await context.set_extra_http_headers(extra_headers)
                
                page = await context.new_page()
                
                response = await page.goto(
                    request.url,
                    timeout=request.timeout * 1000,
                    wait_until="domcontentloaded"
                )
                
                # Brief wait for client-side JS rendering
                try:
                    await page.wait_for_load_state("networkidle", timeout=5000)
                except Exception:
                    pass
                
                html = await page.content()
                status_code = response.status if response else 200
                headers = dict(response.headers) if response else {}
                final_url = page.url
                
                await browser.close()
                
                return ScrapeResponse(
                    url=final_url,
                    html=html,
                    status_code=status_code,
                    headers=headers
                )
        except Exception as e:
            logger.warning(f"Playwright rendering failed or browser not installed ({e}); falling back to fast HttpScraper.")
            fallback = HttpScraper()
            return await fallback.scrape(request)
