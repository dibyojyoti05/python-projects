import asyncio
from workers.celery_app import celery_app
from engines.crawler.spider import Spider
from backend.services.scraper_service import run_scraper_job

def _run_spider_sync(url: str, max_depth: int):
    spider = Spider(start_url=url, max_depth=max_depth)
    return asyncio.run(spider.crawl())

@celery_app.task(name="tasks.crawl_website", bind=True, max_retries=3)
def crawl_website(self, url: str, max_depth: int = 1):
    try:
        results = _run_spider_sync(url, max_depth)
        return {"status": "success", "url": url, "crawled_pages": len(results), "results": results}
    except Exception as exc:
        self.retry(exc=exc, countdown=5)

@celery_app.task(name="tasks.execute_scraper_job", bind=True, max_retries=3)
def execute_scraper_job(self, job_id: str):
    try:
        return asyncio.run(run_scraper_job(job_id))
    except Exception as exc:
        self.retry(exc=exc, countdown=5)
