import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app import models
from app.api import deps
from app.services.storage_service import storage_service
from app.core.config import settings

router = APIRouter()

@router.post("/upload", response_model=dict)
async def upload_asset(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Upload media asset (image, attachment) for email builder campaigns.
    """
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    url = storage_service.save_file(file.filename or "upload.png", content)
    return {
        "filename": file.filename,
        "url": url,
        "size_bytes": len(content),
    }

@router.get("/{filename}")
async def get_uploaded_media(filename: str):
    """
    Serve uploaded media file.
    """
    file_path = os.path.join(os.getcwd(), settings.UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
