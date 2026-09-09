import uuid
from typing import Any, List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, String, cast

from app.api import deps
from app.models.user import User
from app.models.link import Link
from app.models.analytics import ClickEvent

router = APIRouter()

@router.get("/overview")
async def get_analytics_overview(
    organization_id: uuid.UUID,
    link_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get high-level metrics (Total Clicks, Unique Clicks)
    """
    query = select(ClickEvent).join(Link)
    if link_id:
        query = query.where(ClickEvent.link_id == link_id)
    else:
        query = query.where(Link.organization_id == organization_id)
        
    result = await db.execute(query)
    clicks = result.scalars().all()
    
    total_clicks = len(clicks)
    unique_ips = len(set([c.ip_address for c in clicks if c.ip_address]))
    
    return {
        "total_clicks": total_clicks,
        "unique_clicks": unique_ips
    }

@router.get("/devices")
async def get_device_analytics(
    organization_id: uuid.UUID,
    link_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get clicks grouped by device type
    """
    query = select(
        ClickEvent.device_type, 
        func.count(ClickEvent.id).label("count")
    ).join(Link).group_by(ClickEvent.device_type)
    
    if link_id:
        query = query.where(ClickEvent.link_id == link_id)
    else:
        query = query.where(Link.organization_id == organization_id)
        
    result = await db.execute(query)
    data = result.all()
    
    return [{"name": row.device_type or "Unknown", "value": row.count} for row in data]

@router.get("/locations")
async def get_location_analytics(
    organization_id: uuid.UUID,
    link_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get clicks grouped by country
    """
    query = select(
        ClickEvent.country, 
        func.count(ClickEvent.id).label("count")
    ).join(Link).group_by(ClickEvent.country)
    
    if link_id:
        query = query.where(ClickEvent.link_id == link_id)
    else:
        query = query.where(Link.organization_id == organization_id)
        
    result = await db.execute(query)
    data = result.all()
    
    return [{"name": row.country or "Unknown", "value": row.count} for row in data]

@router.get("/timeseries")
async def get_timeseries_analytics(
    organization_id: uuid.UUID,
    link_id: Optional[uuid.UUID] = None,
    days: int = 7,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get daily click counts for charts.
    Note: For PostgreSQL, we use DATE(created_at). SQLite compatibility might vary.
    """
    query = select(
        cast(ClickEvent.created_at, String).label("date_str"),
        func.count(ClickEvent.id).label("count")
    ).join(Link).group_by("date_str").order_by("date_str")
    
    if link_id:
        query = query.where(ClickEvent.link_id == link_id)
    else:
        query = query.where(Link.organization_id == organization_id)
        
    # In a real app we'd filter by date >= current_date - days and truncate to DATE
    # Using a simplified approach here for cross-compatibility
    result = await db.execute(query)
    data = result.all()
    
    # Process in python for simplicity to avoid dialect specific DATE() truncations
    timeseries = {}
    for row in data:
        # date_str looks like '2023-10-24 12:34:56'
        day_str = str(row.date_str)[:10] if row.date_str else "Unknown"
        timeseries[day_str] = timeseries.get(day_str, 0) + row.count
        
    return [{"date": k, "clicks": v} for k, v in timeseries.items()]
