from app.workers.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.scraping.engine import ScrapingEngine
from app.services.scraping.dummy import DummySource
from app.services.scraping.remoteok import RemoteOKSource
from app.services.scraping.arbeitnow import ArbeitnowSource
import logging

logger = logging.getLogger(__name__)

def execute_scraping_sync(keyword: str = "", location: str = "", limit_per_source: int = 25):
    db = SessionLocal()
    try:
        providers = [
            RemoteOKSource(),
            ArbeitnowSource(),
            DummySource()
        ]
        engine = ScrapingEngine(db=db, providers=providers)
        saved_count = engine.run(keyword=keyword, location=location, limit_per_source=limit_per_source)
        logger.info(f"Scraping completed. {saved_count} new jobs saved.")
        return {"status": "completed", "saved": saved_count}
    except Exception as e:
        logger.error(f"Scraping task failed: {e}")
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()

@celery_app.task(name="run_scraping_job")
def run_scraping_job(keyword: str = "", location: str = ""):
    return execute_scraping_sync(keyword=keyword, location=location)

