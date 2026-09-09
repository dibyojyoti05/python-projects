from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class MetricStat(BaseModel):
    name: str
    value: str
    change: str
    is_positive: bool

class ChartDataPoint(BaseModel):
    name: str  # e.g., "Mon", "Tue" or date
    sent: int
    opened: int
    clicked: int

class ActivityItem(BaseModel):
    id: str
    message: str
    time_ago: str
    type: str

class DashboardOverview(BaseModel):
    stats: List[MetricStat]
    chart_data: List[ChartDataPoint]
    recent_activity: List[ActivityItem]
    total_contacts: int
    total_campaigns: int
    total_workflows: int
