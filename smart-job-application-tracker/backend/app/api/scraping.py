from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from app.api import deps
from app.models.user import User
from app.workers.tasks import run_scraping_job, execute_scraping_sync
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/run")
def trigger_scraping(
    background_tasks: BackgroundTasks,
    keyword: Optional[str] = "",
    location: Optional[str] = "",
    current_user: User = Depends(deps.get_current_user)
):
    keyword = keyword or ""
    location = location or ""
    try:
        task = run_scraping_job.delay(keyword, location)
        return {"task_id": task.id, "status": "Queued in Celery worker"}
    except Exception as e:
        logger.warning(f"Celery unavailable ({e}), running via FastAPI background tasks.")
        background_tasks.add_task(execute_scraping_sync, keyword, location)
        return {"task_id": "direct_bg", "status": "Processing in background task"}

