from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.user import User
from app.models.application import Application
from app.models.interview import Interview
from app.schemas.analytics import AnalyticsResponse

router = APIRouter()

@router.get("/", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    # Total applications
    total_apps = db.query(Application).filter(Application.user_id == current_user.id).count()
    
    # Status counts
    status_counts_raw = db.query(Application.status, func.count(Application.id)).filter(Application.user_id == current_user.id).group_by(Application.status).all()
    status_counts = {status: count for status, count in status_counts_raw}
    
    # Specific metrics
    total_interviews = db.query(Interview).join(Application).filter(Application.user_id == current_user.id).count()
    total_offers = status_counts.get("Offer", 0)
    total_rejected = status_counts.get("Rejected", 0)
    pending = total_apps - (total_offers + total_rejected)
    
    # Rates
    responded_apps = total_apps - status_counts.get("Applied", 0) - status_counts.get("Saved", 0)
    response_rate = (responded_apps / total_apps * 100) if total_apps > 0 else 0.0
    interview_rate = (total_interviews / total_apps * 100) if total_apps > 0 else 0.0
    offer_rate = (total_offers / total_interviews * 100) if total_interviews > 0 else 0.0
    
    return AnalyticsResponse(
        total_applications=total_apps,
        total_interviews=total_interviews,
        total_offers=total_offers,
        total_rejected=total_rejected,
        pending=pending,
        response_rate=response_rate,
        interview_rate=interview_rate,
        offer_rate=offer_rate,
        applications_by_status=status_counts
    )
