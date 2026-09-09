import uuid
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.api import deps
from app.models.user import User
from app.models.organization import OrganizationUser
from app.models.subscription import Subscription

router = APIRouter()

class UpgradeRequest(BaseModel):
    organization_id: uuid.UUID
    tier: str # "pro" or "enterprise"

# Defines global quotas based on tier
TIER_LIMITS = {
    "free": {"max_links": 100, "max_campaigns": 2, "api_keys_allowed": False},
    "pro": {"max_links": 5000, "max_campaigns": 50, "api_keys_allowed": True},
    "enterprise": {"max_links": -1, "max_campaigns": -1, "api_keys_allowed": True} # -1 is unlimited
}

@router.get("/{organization_id}")
async def get_subscription(
    organization_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get the subscription status and quotas for an organization.
    """
    # Verify access
    access = await db.execute(select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == organization_id
    ))
    if not access.scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch or create default free subscription
    sub_query = await db.execute(select(Subscription).where(Subscription.organization_id == organization_id))
    subscription = sub_query.scalars().first()
    
    if not subscription:
        subscription = Subscription(organization_id=organization_id, tier="free")
        db.add(subscription)
        await db.commit()
        await db.refresh(subscription)

    limits = TIER_LIMITS.get(subscription.tier, TIER_LIMITS["free"])
    
    return {
        "tier": subscription.tier,
        "limits": limits,
        "current_period_end": subscription.current_period_end
    }

@router.post("/upgrade")
async def upgrade_subscription(
    payload: UpgradeRequest,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Mock endpoint to upgrade a subscription. In reality, this would 
    return a Stripe Checkout Session URL.
    """
    # Verify owner access
    access = await db.execute(select(OrganizationUser).where(
        OrganizationUser.user_id == current_user.id,
        OrganizationUser.organization_id == payload.organization_id
    ))
    role_check = access.scalars().first()
    if not role_check or role_check.role != "owner":
        raise HTTPException(status_code=403, detail="Only owners can upgrade billing")

    sub_query = await db.execute(select(Subscription).where(Subscription.organization_id == payload.organization_id))
    subscription = sub_query.scalars().first()
    
    if not subscription:
        subscription = Subscription(organization_id=payload.organization_id, tier=payload.tier)
        db.add(subscription)
    else:
        subscription.tier = payload.tier

    await db.commit()
    return {"status": "upgraded", "tier": payload.tier}
