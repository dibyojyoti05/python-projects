import asyncio
import time
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any
from sqlalchemy.future import select

from backend.db.session import AsyncSessionLocal
from backend.db.models import ScraperProject, ScrapeJob, ExtractedRecord
from engines.scraper.base import ScrapeRequest
from engines.scraper.http import HttpScraper
from engines.browser.playwright_scraper import PlaywrightScraper
from engines.crawler.spider import Spider
from engines.extraction.parser import DataParser

logger = logging.getLogger(__name__)

async def run_scraper_job(job_id: str):
    """
    Executes a scrape job in the background, parses extracted fields,
    persists records into PostgreSQL, and tracks status.
    """
    start_time = time.time()

    async with AsyncSessionLocal() as session:
        # Load job & project
        result = await session.execute(select(ScrapeJob).where(ScrapeJob.id == job_id))
        job = result.scalars().first()
        if not job:
            logger.error(f"Job {job_id} not found.")
            return

        p_result = await session.execute(select(ScraperProject).where(ScraperProject.id == job.scraper_id))
        project = p_result.scalars().first()
        if not project:
            job.status = "failed"
            job.error_message = "Associated Scraper Project not found."
            await session.commit()
            return

        # Mark as running
        job.status = "running"
        await session.commit()

        try:
            total_pages = 0
            records_to_insert: List[ExtractedRecord] = []
            schema = project.extraction_schema or {}

            # Execute based on scraper_type
            if project.scraper_type == "crawler":
                scraper_engine = PlaywrightScraper() if project.max_depth == 1 else HttpScraper()
                spider = Spider(
                    start_url=project.start_url,
                    max_depth=project.max_depth or 2,
                    max_pages=15,
                    scraper=scraper_engine
                )
                crawled_results = await spider.crawl()
                total_pages = len(crawled_results)

                for page in crawled_results:
                    html = page.get("html", "")
                    url = page.get("url", project.start_url)
                    if html and schema:
                        parser = DataParser(html)
                        rows = parser.extract_records(schema)
                        for row in rows:
                            records_to_insert.append(ExtractedRecord(
                                job_id=job.id,
                                scraper_id=project.id,
                                source_url=url,
                                data=row
                            ))
            else:
                # Single page scrape (http or playwright)
                if project.scraper_type == "playwright":
                    scraper_engine = PlaywrightScraper()
                else:
                    scraper_engine = HttpScraper()

                req = ScrapeRequest(
                    url=project.start_url,
                    proxy=project.proxy,
                    headers=project.headers or {},
                    timeout=30
                )
                response = await scraper_engine.scrape(req)
                total_pages = 1

                if response.html and schema:
                    parser = DataParser(response.html)
                    rows = parser.extract_records(schema)
                    for row in rows:
                        records_to_insert.append(ExtractedRecord(
                            job_id=job.id,
                            scraper_id=project.id,
                            source_url=response.url,
                            data=row
                        ))

            # Batch add records
            for rec in records_to_insert:
                session.add(rec)

            job.status = "completed"
            job.total_pages = total_pages
            job.extracted_records_count = len(records_to_insert)
            job.duration_ms = int((time.time() - start_time) * 1000)
            job.completed_at = datetime.now(timezone.utc)
            await session.commit()
            logger.info(f"Job {job_id} completed successfully. Extracted {len(records_to_insert)} records.")

        except Exception as e:
            logger.exception(f"Error executing scrape job {job_id}: {e}")
            job.status = "failed"
            job.error_message = str(e)
            job.duration_ms = int((time.time() - start_time) * 1000)
            job.completed_at = datetime.now(timezone.utc)
            await session.commit()
