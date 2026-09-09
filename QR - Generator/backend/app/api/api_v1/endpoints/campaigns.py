from typing import Any, List, Optional
from datetime import datetime
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel, ConfigDict

from app.api import deps
from app.models.user import User, UserRole
from app.models.campaign import Campaign
from app.models.qr_code import QRCode
from app.models.organization import Organization, OrganizationMember

router = APIRouter()

class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None

class CampaignCreate(CampaignBase):
    organization_id: Optional[UUID] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CampaignResponse(CampaignBase):
    id: UUID
    organization_id: UUID
    created_at: Optional[datetime] = None
    qr_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

async def get_or_default_org(db: AsyncSession, user: User) -> UUID:
    stmt_orgs = select(OrganizationMember.organization_id).where(OrganizationMember.user_id == user.id)
    res_orgs = await db.execute(stmt_orgs)
    org_id = res_orgs.scalar_one_or_none()
    if org_id:
        return org_id
        
    stmt_def = select(Organization.id).where(Organization.name == "Default Organization")
    res_def = await db.execute(stmt_def)
    def_id = res_def.scalar_one_or_none()
    if def_id:
        mem = OrganizationMember(organization_id=def_id, user_id=user.id, role=UserRole.ADMIN)
        db.add(mem)
        await db.commit()
        return def_id
        
    new_org = Organization(id=uuid4(), name=f"{user.full_name or 'Default'}'s Org")
    db.add(new_org)
    await db.commit()
    await db.refresh(new_org)
    mem = OrganizationMember(organization_id=new_org.id, user_id=user.id, role=UserRole.ADMIN)
    db.add(mem)
    await db.commit()
    return new_org.id

@router.post("/", response_model=CampaignResponse)
async def create_campaign(
    *,
    db: AsyncSession = Depends(deps.get_db),
    campaign_in: CampaignCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    org_id = campaign_in.organization_id or await get_or_default_org(db, current_user)
    campaign = Campaign(
        id=uuid4(),
        organization_id=org_id,
        name=campaign_in.name,
        description=campaign_in.description
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    campaign.qr_count = 0
    return campaign

@router.get("/", response_model=List[CampaignResponse])
async def read_campaigns(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    stmt = select(Campaign).order_by(desc(Campaign.created_at)).offset(skip).limit(limit)
    result = await db.execute(stmt)
    campaigns = result.scalars().all()
    
    for c in campaigns:
        count_stmt = select(func.count(QRCode.id)).where(QRCode.campaign_id == c.id)
        count_res = await db.execute(count_stmt)
        c.qr_count = count_res.scalar() or 0
        
    return campaigns

@router.get("/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    res = await db.execute(stmt)
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    count_stmt = select(func.count(QRCode.id)).where(QRCode.campaign_id == camp.id)
    count_res = await db.execute(count_stmt)
    camp.qr_count = count_res.scalar() or 0
    return camp

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: UUID,
    campaign_update: CampaignUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    res = await db.execute(stmt)
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    update_data = campaign_update.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(camp, key, val)
        
    await db.commit()
    await db.refresh(camp)
    
    count_stmt = select(func.count(QRCode.id)).where(QRCode.campaign_id == camp.id)
    count_res = await db.execute(count_stmt)
    camp.qr_count = count_res.scalar() or 0
    return camp

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    stmt = select(Campaign).where(Campaign.id == campaign_id)
    res = await db.execute(stmt)
    camp = res.scalar_one_or_none()
    if not camp:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    await db.delete(camp)
    await db.commit()
    return {"message": "Campaign deleted successfully"}
