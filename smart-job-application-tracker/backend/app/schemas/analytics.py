from pydantic import BaseModel
from typing import Dict

class AnalyticsResponse(BaseModel):
    total_applications: int
    total_interviews: int
    total_offers: int
    total_rejected: int
    pending: int
    response_rate: float
    interview_rate: float
    offer_rate: float
    applications_by_status: Dict[str, int]
