from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.camera import Camera
from app.schemas.camera import Camera as CameraSchema, CameraCreate, CameraUpdate

router = APIRouter()

@router.get("/", response_model=List[CameraSchema])
def read_cameras(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """List all registered cameras."""
    cameras = db.query(Camera).order_by(Camera.id.asc()).offset(skip).limit(limit).all()
    return cameras

@router.post("/", response_model=CameraSchema)
def create_camera(
    *,
    db: Session = Depends(deps.get_db),
    camera_in: CameraCreate,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Register a new camera."""
    camera = Camera(
        name=camera_in.name,
        location=camera_in.location,
        rtsp_url=camera_in.rtsp_url,
        ai_enabled=camera_in.ai_enabled,
        is_active=True,
        is_connected=True
    )
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@router.get("/{camera_id}", response_model=CameraSchema)
def get_camera(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Retrieve specific camera by ID."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.put("/{camera_id}", response_model=CameraSchema)
def update_camera(
    camera_id: int,
    camera_in: CameraUpdate,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Update camera properties."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    update_data = camera_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)
    
    db.commit()
    db.refresh(camera)
    return camera

@router.delete("/{camera_id}")
def delete_camera(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Delete a camera."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    db.delete(camera)
    db.commit()
    return {"message": f"Camera {camera_id} deleted successfully", "id": camera_id}

@router.post("/{camera_id}/toggle-ai", response_model=CameraSchema)
def toggle_camera_ai(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Toggle AI detection for a camera."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    camera.ai_enabled = not camera.ai_enabled
    db.commit()
    db.refresh(camera)
    return camera
