import uuid
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.link import Link
from app.services.qr_generator import QRGeneratorService
from app.models.user import User

router = APIRouter()

@router.post("/generate/{link_id}")
async def generate_qr_code(
    link_id: uuid.UUID,
    fg_color: str = Form("#000000"),
    bg_color: str = Form("#ffffff"),
    format: str = Form("png"), # png or svg
    rounded: bool = Form(False),
    logo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Generate a QR code for a specific link, optionally with logo and colors.
    Returns the binary image data.
    """
    result = await db.execute(select(Link).where(Link.id == link_id))
    link = result.scalars().first()
    
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")
        
    # In production, baseUrl would come from settings
    url_to_encode = f"http://localhost:8000/{link.custom_slug or link.short_code}"
    
    logo_bytes = await logo.read() if logo else None

    if format.lower() == "svg":
        svg_bytes = QRGeneratorService.generate_svg(url_to_encode, fg_color, bg_color)
        return Response(content=svg_bytes, media_type="image/svg+xml")
    else:
        png_bytes = QRGeneratorService.generate_png(
            url_to_encode, fg_color, bg_color, logo_bytes, rounded
        )
        return Response(content=png_bytes, media_type="image/png")
