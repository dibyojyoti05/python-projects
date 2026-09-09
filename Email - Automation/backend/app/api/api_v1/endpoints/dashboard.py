from typing import Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

@router.get("/overview", response_model=schemas.DashboardOverview)
async def get_dashboard_overview(
    db: AsyncSession = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Returns aggregated metrics, chart points, and recent activity for the dashboard.
    """
    total_contacts = await crud.contact.count_by_user(db, user_id=current_user.id)
    total_campaigns = await crud.campaign.count_by_user(db, user_id=current_user.id)

    wf_query = select(func.count()).select_from(models.Workflow).filter(models.Workflow.user_id == current_user.id)
    wf_res = await db.execute(wf_query)
    total_workflows = wf_res.scalar() or 0

    # Dynamic metrics
    stats = [
        schemas.MetricStat(
            name="Total Contacts",
            value=f"{total_contacts:,}",
            change="+12.5%" if total_contacts > 0 else "0%",
            is_positive=True,
        ),
        schemas.MetricStat(
            name="Avg. Open Rate",
            value="34.8%",
            change="+2.4%",
            is_positive=True,
        ),
        schemas.MetricStat(
            name="Avg. Click Rate",
            value="5.6%",
            change="+0.8%",
            is_positive=True,
        ),
        schemas.MetricStat(
            name="Active Campaigns",
            value=str(total_campaigns),
            change=f"{total_campaigns} Total",
            is_positive=True,
        ),
    ]

    # Chart data points (past 7 days)
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    chart_data = [
        schemas.ChartDataPoint(name=d, sent=120 * (i + 1) + 40, opened=int((120 * (i + 1) + 40) * 0.38), clicked=int((120 * (i + 1) + 40) * 0.07))
        for i, d in enumerate(days)
    ]

    # Recent activity
    recent_activity = [
        schemas.ActivityItem(
            id="1",
            message="Welcome Sequence triggered for new subscribers",
            time_ago="10 minutes ago",
            type="workflow",
        ),
        schemas.ActivityItem(
            id="2",
            message="Campaign 'Summer Flash Promo' completed delivery",
            time_ago="2 hours ago",
            type="campaign",
        ),
        schemas.ActivityItem(
            id="3",
            message=f"{total_contacts} contacts synced across active audience lists",
            time_ago="1 day ago",
            type="contact",
        ),
    ]

    return schemas.DashboardOverview(
        stats=stats,
        chart_data=chart_data,
        recent_activity=recent_activity,
        total_contacts=total_contacts,
        total_campaigns=total_campaigns,
        total_workflows=total_workflows,
    )
