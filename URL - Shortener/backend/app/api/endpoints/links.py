import uuid
import string
import random
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.user import User
from app.models.link import Link
from app.models.organization import OrganizationUser
from app.schemas.link import LinkCreate, LinkUpdate, Link as LinkSchema
from app.core import security
from app.core.quotas import check_link_quota

router = APIRouter()

def generate_short_code(length: int = 7) -> str:
    chars = string.ascii_letters + string.digits
    return "".join(random.choice(chars) for _ in range(length))

@router.post("/", response_model=LinkSchema)
async def create_link(
    *,
    db: AsyncSession = Depends(deps.get_db),
    link_in: LinkCreate,
    current_user: User = Depends(deps.get_current_user_or_api_key_user),
) -> Any:
    """
    Create new short link.
    """
    # Check if user is in organization
    org_user_query = select(OrganizationUser).where(
        OrganizationUser.organization_id == link_in.organization_id,
        OrganizationUser.user_id == current_user.id
    )
    org_user_result = await db.execute(org_user_query)
    if not org_user_result.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to create links for this organization")

    # Enforce Billing Quotas
    await check_link_quota(link_in.organization_id, db)

    # Verify custom slug uniqueness
    short_code = link_in.custom_slug
    if short_code:
        result = await db.execute(select(Link).where(Link.custom_slug == short_code))
        if result.scalars().first():
            raise HTTPException(status_code=400, detail="Custom slug already exists")
    else:
        while True:
            short_code = generate_short_code()
            result = await db.execute(select(Link).where(Link.short_code == short_code))
            if not result.scalars().first():
                break

    pwd_hash = security.get_password_hash(link_in.password) if link_in.password else None
    
    link = Link(
        organization_id=link_in.organization_id,
        original_url=link_in.original_url,
        short_code=short_code,
        custom_slug=link_in.custom_slug,
        password_hash=pwd_hash,
        expires_at=link_in.expires_at,
        activates_at=link_in.activates_at,
        click_limit=link_in.click_limit,
        is_active=link_in.is_active,
        geo_routing=link_in.geo_routing,
        device_routing=link_in.device_routing,
        os_routing=link_in.os_routing,
        language_routing=link_in.language_routing,
        created_by=current_user.id
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)

    return link

@router.get("/", response_model=List[LinkSchema])
async def read_links(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    organization_id: Optional[uuid.UUID] = None,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve links with accurate click counts.
    """
    if not organization_id:
        # Fallback to user's first organization
        user_orgs = await db.execute(select(OrganizationUser.organization_id).where(OrganizationUser.user_id == current_user.id))
        org_ids = user_orgs.scalars().all()
        if not org_ids:
            return []
        query = select(Link).where(Link.organization_id.in_(org_ids)).order_by(Link.created_at.desc()).offset(skip).limit(limit)
    else:
        # Check authorization
        org_user_query = select(OrganizationUser).where(
            OrganizationUser.organization_id == organization_id,
            OrganizationUser.user_id == current_user.id
        )
        org_user_result = await db.execute(org_user_query)
        if not org_user_result.scalars().first():
            raise HTTPException(status_code=403, detail="Not authorized to view links for this organization")

        query = select(Link).where(Link.organization_id == organization_id).order_by(Link.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    links = result.scalars().all()

    # Get click counts for each link
    from app.models.analytics import ClickEvent
    from sqlalchemy import func
    
    link_ids = [l.id for l in links]
    click_counts = {}
    if link_ids:
        click_query = select(ClickEvent.link_id, func.count(ClickEvent.id)).where(ClickEvent.link_id.in_(link_ids)).group_by(ClickEvent.link_id)
        click_res = await db.execute(click_query)
        for lid, count in click_res.all():
            click_counts[lid] = count

    response_links = []
    for link in links:
        link_dict = LinkSchema.model_validate(link).model_dump()
        link_dict["click_count"] = click_counts.get(link.id, 0)
        response_links.append(link_dict)

    return response_links

@router.put("/{link_id}", response_model=LinkSchema)
async def update_link(
    *,
    db: AsyncSession = Depends(deps.get_db),
    link_id: uuid.UUID,
    link_in: LinkUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a link.
    """
    result = await db.execute(select(Link).where(Link.id == link_id))
    link = result.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # Check authorization
    org_user_query = select(OrganizationUser).where(
        OrganizationUser.organization_id == link.organization_id,
        OrganizationUser.user_id == current_user.id
    )
    org_user_res = await db.execute(org_user_query)
    if not org_user_res.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to update this link")
        
    update_data = link_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(link, field, value)
        
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link

@router.delete("/{link_id}")
async def delete_link(
    *,
    db: AsyncSession = Depends(deps.get_db),
    link_id: uuid.UUID,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a link.
    """
    result = await db.execute(select(Link).where(Link.id == link_id))
    link = result.scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Link not found")

    # Check authorization
    org_user_query = select(OrganizationUser).where(
        OrganizationUser.organization_id == link.organization_id,
        OrganizationUser.user_id == current_user.id
    )
    org_user_res = await db.execute(org_user_query)
    caller_role = org_user_res.scalars().first()
    if not caller_role or caller_role.role not in ["owner", "admin", "member"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this link")

    await db.delete(link)
    await db.commit()
    return {"status": "deleted", "id": str(link_id)}

