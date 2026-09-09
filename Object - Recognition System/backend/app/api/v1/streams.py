from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api import deps
from app.db.models.camera import Camera
from app.engine.stream_manager import stream_manager

router = APIRouter()

@router.get("/active")
def get_active_streams(current_user = Depends(deps.get_current_active_user)) -> Any:
    """Return list of camera IDs with active live streams."""
    return {"active_camera_ids": stream_manager.get_active_cameras()}

@router.post("/{camera_id}/start")
def start_stream(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Start streaming for a given camera ID."""
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail="Camera not found")

    stream_manager.add_camera(camera_id, camera.rtsp_url, camera_name=camera.name)
    return {"message": f"Camera {camera_id} stream started.", "camera_id": camera_id}

@router.post("/{camera_id}/stop")
def stop_stream(
    camera_id: int,
    current_user = Depends(deps.get_current_active_user)
) -> Any:
    """Stop streaming for a camera."""
    stream_manager.remove_camera(camera_id)
    return {"message": f"Camera {camera_id} stream stopped.", "camera_id": camera_id}

@router.get("/{camera_id}/stream")
def video_feed(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """
    Live multipart MJPEG video feed.
    Accepts Bearer auth header or ?token=<jwt> query parameter.
    """
    if camera_id not in stream_manager.streams or not stream_manager.streams[camera_id].is_running:
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        stream_manager.add_camera(camera_id, camera.rtsp_url, camera_name=camera.name)

    return StreamingResponse(
        stream_manager.generate_frames(camera_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/{camera_id}/snapshot")
def get_snapshot(
    camera_id: int,
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_user)
):
    """Retrieve a single current snapshot frame as image/jpeg."""
    if camera_id not in stream_manager.streams:
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        if not camera:
            raise HTTPException(status_code=404, detail="Camera not found")
        stream_manager.add_camera(camera_id, camera.rtsp_url, camera_name=camera.name)

    frame = stream_manager.get_snapshot(camera_id)
    if not frame:
        raise HTTPException(status_code=503, detail="Frame not ready yet. Try again shortly.")

    return Response(content=frame, media_type="image/jpeg")
