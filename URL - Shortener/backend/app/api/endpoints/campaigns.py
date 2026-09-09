import uuid
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from urllib.parse import urlparse, urlencode, parse_qsl, urlunparse
import random
import string

from app.api import deps
from app.models.user import User
from app.models.link import Link
from app.models.folder import Folder
from pydantic import BaseModel, HttpUrl

router = APIRouter()

class UTMParams(BaseModel):
    utm_source: Optional[str] = None
    utm_medium: Optional[str] = None
    utm_campaign: Optional[str] = None
    utm_term: Optional[str] = None
    utm_content: Optional[str] = None

class BulkLinkCreate(BaseModel):
    original_urls: List[str]
    organization_id: uuid.UUID
    folder_name: str # The campaign name
    utm: Optional[UTMParams] = None

def generate_short_code(length: int = 7) -> str:
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def append_utm(url: str, utm: UTMParams) -> str:
    if not utm:
        return url
    
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query))
    
    if utm.utm_source: query['utm_source'] = utm.utm_source
    if utm.utm_medium: query['utm_medium'] = utm.utm_medium
    if utm.utm_campaign: query['utm_campaign'] = utm.utm_campaign
    if utm.utm_term: query['utm_term'] = utm.utm_term
    if utm.utm_content: query['utm_content'] = utm.utm_content
    
    new_query = urlencode(query)
    parsed_with_utm = parsed._replace(query=new_query)
    return urlunparse(parsed_with_utm)

@router.post("/bulk")
async def create_campaign_bulk_links(
    payload: BulkLinkCreate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Creates a new campaign folder and bulk generates shortened links with attached UTM parameters.
    """
    # 1. Create or Find Folder
    query = select(Folder).where(
        Folder.name == payload.folder_name,
        Folder.organization_id == payload.organization_id
    )
    result = await db.execute(query)
    folder = result.scalars().first()
    
    if not folder:
        folder = Folder(
            name=payload.folder_name,
            organization_id=payload.organization_id
        )
        db.add(folder)
        await db.commit()
        await db.refresh(folder)
        
    created_links = []
    
    # 2. Process URLs
    for url in payload.original_urls:
        final_url = append_utm(url, payload.utm) if payload.utm else url
        short_code = generate_short_code()
        
        # Ensure unique (simplified for now without while loop retry)
        
        new_link = Link(
            original_url=final_url,
            short_code=short_code,
            organization_id=payload.organization_id,
            folder_id=folder.id,
            created_by=current_user.id
        )
        db.add(new_link)
        created_links.append({
            "original_url": final_url,
            "short_code": short_code,
            "folder_id": str(folder.id)
        })
        
    await db.commit()
    
    return {
        "campaign_folder": folder.name,
        "folder_id": str(folder.id),
        "links_generated": len(created_links),
        "links": created_links
    }

@router.get("/")
async def list_campaigns(
    organization_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    List all campaign folders with associated link counts.
    """
    from sqlalchemy import func
    from app.models.organization import OrganizationUser
    
    # Access check
    access = await db.execute(select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == organization_id
    ))
    if not access.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized")

    folders_res = await db.execute(select(Folder).where(Folder.organization_id == organization_id))
    folders = folders_res.scalars().all()

    result = []
    for f in folders:
        link_count_res = await db.execute(select(func.count(Link.id)).where(Link.folder_id == f.id))
        count = link_count_res.scalar() or 0
        result.append({
            "id": str(f.id),
            "name": f.name,
            "link_count": count
        })
    return result

@router.get("/{folder_id}/links")
async def get_campaign_links(
    folder_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    folder_res = await db.execute(select(Folder).where(Folder.id == folder_id))
    folder = folder_res.scalars().first()
    if not folder:
        raise HTTPException(status_code=404, detail="Campaign folder not found")

    links_res = await db.execute(select(Link).where(Link.folder_id == folder_id))
    links = links_res.scalars().all()
    return [{
        "id": str(l.id),
        "original_url": l.original_url,
        "short_code": l.short_code,
        "custom_slug": l.custom_slug,
        "is_active": l.is_active
    } for l in links]

