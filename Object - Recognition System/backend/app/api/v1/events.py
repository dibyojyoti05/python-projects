from typing import Any, List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.api import deps
from app.db.models.event import DetectionEvent
from app.db.models.camera import Camera
from app.schemas.event import DetectionEvent as EventSchema, DetectionEventCreate

router = APIRouter()

@router.get("/", response_model=List[EventSchema])
def read_events(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    camera_id: Optional[int] = None,
    object_class: Optional[str] = None,
    min_confidence: Optional[float] = None,
    search: Optional[str] = None,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """List detection events with rich filtering."""
    query = db.query(DetectionEvent)
    
    if camera_id is not None:
        query = query.filter(DetectionEvent.camera_id == camera_id)
    if object_class:
        query = query.filter(DetectionEvent.object_class.ilike(f"%{object_class}%"))
    if min_confidence is not None:
        query = query.filter(DetectionEvent.confidence >= min_confidence)
    if search:
        query = query.filter(
            (DetectionEvent.tracking_id.ilike(f"%{search}%")) |
            (DetectionEvent.object_class.ilike(f"%{search}%")) |
            (DetectionEvent.zone_name.ilike(f"%{search}%"))
        )
        
    events = query.order_by(desc(DetectionEvent.timestamp)).offset(skip).limit(limit).all()
    return events

@router.get("/stats/summary")
def get_events_summary(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Summary metrics for the vision platform dashboard."""
    total_events = db.query(DetectionEvent).count()
    total_cameras = db.query(Camera).count()
    active_cameras = db.query(Camera).filter(Camera.is_active == True).count()
    
    since_24h = datetime.utcnow() - timedelta(hours=24)
    events_24h = db.query(DetectionEvent).filter(DetectionEvent.timestamp >= since_24h).count()
    high_confidence_count = db.query(DetectionEvent).filter(
        DetectionEvent.timestamp >= since_24h,
        DetectionEvent.confidence >= 0.85
    ).count()

    unique_classes = db.query(func.count(func.distinct(DetectionEvent.object_class))).scalar()

    return {
        "total_detections": total_events,
        "total_cameras": total_cameras,
        "active_cameras": active_cameras,
        "detections_24h": events_24h,
        "high_confidence_alerts": high_confidence_count,
        "unique_classes_count": unique_classes or 0,
        "status": "online"
    }

@router.get("/stats/hourly")
def get_hourly_stats(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Return detections grouped by hour for the past 24 hours."""
    since_24h = datetime.utcnow() - timedelta(hours=24)
    recent_events = db.query(DetectionEvent.timestamp).filter(
        DetectionEvent.timestamp >= since_24h
    ).all()

    # Bucket into hourly increments
    hourly_buckets = {}
    for h in range(24):
        slot_time = since_24h + timedelta(hours=h)
        label = slot_time.strftime("%H:00")
        hourly_buckets[label] = 0

    for (t,) in recent_events:
        if t:
            label = t.strftime("%H:00")
            if label in hourly_buckets:
                hourly_buckets[label] += 1
            else:
                hourly_buckets[label] = 1

    chart_data = [{"time": k, "detections": v} for k, v in sorted(hourly_buckets.items())]
    return chart_data

@router.get("/stats/classes")
def get_classes_distribution(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Distribution of detected object classes."""
    results = db.query(
        DetectionEvent.object_class,
        func.count(DetectionEvent.id).label("count"),
        func.avg(DetectionEvent.confidence).label("avg_conf")
    ).group_by(DetectionEvent.object_class).order_by(desc("count")).all()

    return [
        {
            "object_class": r[0],
            "count": r[1],
            "avg_confidence": round(float(r[2]), 2) if r[2] else 0.0
        }
        for r in results
    ]

@router.post("/", response_model=EventSchema)
def create_detection_event(
    *,
    db: Session = Depends(deps.get_db),
    event_in: DetectionEventCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Manually insert or trigger a detection event."""
    event = DetectionEvent(
        camera_id=event_in.camera_id,
        object_class=event_in.object_class,
        confidence=event_in.confidence,
        tracking_id=event_in.tracking_id,
        bounding_box=event_in.bounding_box,
        snapshot_path=event_in.snapshot_path,
        zone_name=event_in.zone_name,
        duration_seconds=event_in.duration_seconds
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.delete("/{event_id}")
def delete_detection_event(
    event_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Delete a detection event."""
    event = db.query(DetectionEvent).filter(DetectionEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": f"Event {event_id} deleted successfully"}
