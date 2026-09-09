import uuid
import secrets
import string
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from collections import Counter

from app.api import deps
from app.models.user import User
from app.models.organization import Organization, OrganizationMember
from app.models.qr_code import QRCode, QRCodeType
from app.models.scan import Scan
from app.schemas.qr_code import QRCode as QRCodeSchema, QRCodeCreate, QRCodeUpdate, QRCodeAnalytics
from app.services.qr_generator import generate_qr_code
from app.services.storage import upload_qr_image

router = APIRouter()

def generate_short_code(length=7):
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))

async def get_or_create_user_org_id(db: AsyncSession, user: User) -> uuid.UUID:
    # Check if user has membership
    stmt = select(OrganizationMember.organization_id).where(OrganizationMember.user_id == user.id)
    res = await db.execute(stmt)
    org_id = res.scalar_one_or_none()
    if org_id:
        return org_id
        
    # Check if default org exists
    stmt_org = select(Organization.id).where(Organization.name == "Default Organization")
    res_org = await db.execute(stmt_org)
    default_org_id = res_org.scalar_one_or_none()
    if default_org_id:
        # Create membership
        mem = OrganizationMember(organization_id=default_org_id, user_id=user.id)
        db.add(mem)
        await db.commit()
        return default_org_id
        
    # Create an organization for the user
    new_org = Organization(id=uuid.uuid4(), name=f"{user.full_name or 'User'}'s Workspace")
    db.add(new_org)
    await db.commit()
    await db.refresh(new_org)
    mem = OrganizationMember(organization_id=new_org.id, user_id=user.id)
    db.add(mem)
    await db.commit()
    return new_org.id

@router.post("/preview")
async def preview_qr_code(
    payload: dict,
):
    """
    Generate live preview QR code bytes on the fly without saving to DB.
    """
    data = payload.get("data", "https://example.com")
    customization = payload.get("customization", {})
    fmt = payload.get("format", "svg")
    image_bytes, mime_type = generate_qr_code(data, customization, img_format=fmt)
    return Response(content=image_bytes, media_type=mime_type)

@router.post("/", response_model=QRCodeSchema)
async def create_qr_code(
    *,
    db: AsyncSession = Depends(deps.get_db),
    qr_in: QRCodeCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new dynamic or static QR Code.
    """
    qr_id = uuid.uuid4()
    short_code = generate_short_code() if qr_in.is_dynamic else None
    
    # Resolve organization
    org_id = qr_in.organization_id
    if not org_id:
        org_id = await get_or_create_user_org_id(db, current_user)
        
    # Determine the payload to encode in the QR
    if qr_in.is_dynamic:
        qr_data = f"http://localhost:8000/r/{short_code}"
    else:
        qr_data = qr_in.destination_url or qr_in.raw_data or ""
        
    image_bytes, mime_type = generate_qr_code(qr_data, qr_in.customization)
    image_url = upload_qr_image(image_bytes, mime_type, qr_id)
    
    qr_code = QRCode(
        id=qr_id,
        organization_id=org_id,
        campaign_id=qr_in.campaign_id,
        name=qr_in.name,
        is_dynamic=qr_in.is_dynamic,
        qr_type=qr_in.qr_type,
        destination_url=qr_in.destination_url,
        raw_data=qr_in.raw_data,
        short_code=short_code,
        customization=qr_in.customization,
        image_url=image_url,
        is_active=qr_in.is_active
    )
    db.add(qr_code)
    await db.commit()
    await db.refresh(qr_code)
    
    qr_code.scan_count = 0
    return qr_code

@router.get("/", response_model=List[QRCodeSchema])
async def read_qr_codes(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve QR codes for the current user's organization(s).
    """
    # Fetch user's organizations
    stmt_orgs = select(OrganizationMember.organization_id).where(OrganizationMember.user_id == current_user.id)
    res_orgs = await db.execute(stmt_orgs)
    user_org_ids = [row[0] for row in res_orgs.all()]
    
    if not user_org_ids:
        # Fallback to default org
        stmt_all = select(QRCode).order_by(desc(QRCode.created_at)).offset(skip).limit(limit)
        res = await db.execute(stmt_all)
        qr_list = res.scalars().all()
    else:
        stmt = select(QRCode).where(QRCode.organization_id.in_(user_org_ids)).order_by(desc(QRCode.created_at)).offset(skip).limit(limit)
        res = await db.execute(stmt)
        qr_list = res.scalars().all()
        
    # Annotate scan counts
    for qr in qr_list:
        scan_count_stmt = select(func.count(Scan.id)).where(Scan.qr_code_id == qr.id)
        count_res = await db.execute(scan_count_stmt)
        qr.scan_count = count_res.scalar() or 0
        
    return qr_list

@router.get("/{qr_id}", response_model=QRCodeSchema)
async def get_qr_code(
    qr_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    stmt = select(QRCode).where(QRCode.id == qr_id)
    res = await db.execute(stmt)
    qr = res.scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code not found")
        
    scan_count_stmt = select(func.count(Scan.id)).where(Scan.qr_code_id == qr.id)
    count_res = await db.execute(scan_count_stmt)
    qr.scan_count = count_res.scalar() or 0
    return qr

@router.put("/{qr_id}", response_model=QRCodeSchema)
async def update_qr_code(
    qr_id: uuid.UUID,
    qr_update: QRCodeUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update dynamic destination URL, title, customization, or active state.
    """
    stmt = select(QRCode).where(QRCode.id == qr_id)
    res = await db.execute(stmt)
    qr = res.scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code not found")
        
    update_data = qr_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(qr, field, val)
        
    await db.commit()
    await db.refresh(qr)
    
    scan_count_stmt = select(func.count(Scan.id)).where(Scan.qr_code_id == qr.id)
    count_res = await db.execute(scan_count_stmt)
    qr.scan_count = count_res.scalar() or 0
    return qr

@router.delete("/{qr_id}")
async def delete_qr_code(
    qr_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    stmt = select(QRCode).where(QRCode.id == qr_id)
    res = await db.execute(stmt)
    qr = res.scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code not found")
        
    await db.delete(qr)
    await db.commit()
    return {"message": "QR code deleted successfully"}

@router.get("/{qr_id}/image")
async def get_qr_image(
    qr_id: uuid.UUID,
    format: str = Query("svg", pattern="^(svg|png)$"),
    scale: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(deps.get_db),
):
    """
    Directly serve the rendered QR code image in SVG or PNG.
    """
    stmt = select(QRCode).where(QRCode.id == qr_id)
    res = await db.execute(stmt)
    qr = res.scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code not found")
        
    if qr.is_dynamic:
        data = f"http://localhost:8000/r/{qr.short_code}"
    else:
        data = qr.destination_url or qr.raw_data or ""
        
    customization = dict(qr.customization or {})
    customization["scale"] = scale
    
    image_bytes, mime = generate_qr_code(data, customization, img_format=format)
    return Response(
        content=image_bytes,
        media_type=mime,
        headers={"Cache-Control": "public, max-age=3600"}
    )

@router.get("/{qr_id}/analytics", response_model=QRCodeAnalytics)
async def get_qr_analytics(
    qr_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve comprehensive scan analytics, device breakdown, and recent scan logs.
    """
    stmt = select(QRCode).where(QRCode.id == qr_id)
    res = await db.execute(stmt)
    qr = res.scalar_one_or_none()
    if not qr:
        raise HTTPException(status_code=404, detail="QR Code not found")
        
    # Get all scans
    scan_stmt = select(Scan).where(Scan.qr_code_id == qr_id).order_by(desc(Scan.scanned_at))
    scan_res = await db.execute(scan_stmt)
    scans = scan_res.scalars().all()
    
    total_scans = len(scans)
    unique_visitors = len(set(s.ip_address for s in scans if s.ip_address))
    last_scanned_at = scans[0].scanned_at if scans else None
    
    devices = Counter(s.device_type or "Unknown" for s in scans)
    browsers = Counter(s.browser or "Unknown" for s in scans)
    os_dict = Counter(s.os or "Unknown" for s in scans)
    
    recent_scans = [
        {
            "id": str(s.id),
            "ip": s.ip_address or "Unknown",
            "country": s.country or "Unknown",
            "city": s.city or "Unknown",
            "device": s.device_type or "Desktop",
            "browser": s.browser or "Browser",
            "os": s.os or "Unknown",
            "referrer": s.referrer or "Direct",
            "scanned_at": s.scanned_at.isoformat() if s.scanned_at else ""
        }
        for s in scans[:20]
    ]
    
    return QRCodeAnalytics(
        total_scans=total_scans,
        unique_visitors=unique_visitors,
        last_scanned_at=last_scanned_at,
        devices=dict(devices),
        browsers=dict(browsers),
        operating_systems=dict(os_dict),
        recent_scans=recent_scans
    )
