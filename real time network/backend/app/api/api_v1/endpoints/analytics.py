from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.api import deps
from app.models.network import NetworkMetric, Alert, Incident, Device

router = APIRouter()

@router.get("/dashboard")
async def get_dashboard_summary(
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    # Get latest metric
    result = await db.execute(select(NetworkMetric).order_by(NetworkMetric.timestamp.desc()).limit(1))
    latest_metric = result.scalars().first()

    # Get active alerts count
    alerts_result = await db.execute(select(func.count(Alert.id)).where(Alert.status == "ACTIVE"))
    active_alerts = alerts_result.scalar() or 0

    # Get online devices count
    devices_result = await db.execute(select(func.count(Device.id)).where(Device.is_online == True))
    online_devices = devices_result.scalar() or 0

    health_score = 100
    if latest_metric:
        if latest_metric.latency_ms and latest_metric.latency_ms > 100:
            health_score -= 10
        if latest_metric.packet_loss_percent and latest_metric.packet_loss_percent > 0:
            health_score -= min(30, latest_metric.packet_loss_percent * 5)
        if not latest_metric.is_online:
            health_score = 0

    return {
        "status": "ONLINE" if latest_metric and latest_metric.is_online else "OFFLINE",
        "latency_ms": latest_metric.latency_ms if latest_metric else 0,
        "packet_loss_percent": latest_metric.packet_loss_percent if latest_metric else 0,
        "download_mbps": (latest_metric.bytes_received * 8 / 1000000) if latest_metric else 0,
        "upload_mbps": (latest_metric.bytes_sent * 8 / 1000000) if latest_metric else 0,
        "health_score": max(0, health_score),
        "active_alerts": active_alerts,
        "online_devices": online_devices
    }

@router.get("/history")
async def get_metrics_history(
    limit: int = 60,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    result = await db.execute(select(NetworkMetric).order_by(NetworkMetric.timestamp.desc()).limit(limit))
    metrics = result.scalars().all()
    # Return chronologically
    return list(reversed(metrics))
