from typing import Any
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.api import deps
from app.core.config import settings

router = APIRouter()

@router.get("/health")
def get_system_health(db: Session = Depends(deps.get_db)) -> Any:
    """Check status of database, API, and core services."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "database": {
            "status": db_status,
            "host": settings.POSTGRES_SERVER,
            "port": settings.POSTGRES_PORT,
            "database": settings.POSTGRES_DB
        },
        "version": "1.0.0",
        "server_time": datetime.utcnow().isoformat(),
        "ai_engine": {
            "model": "YOLOv8n",
            "tracker": "ByteTrack",
            "inference_mode": "hybrid (native/simulated)"
        }
    }
