import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException

from app.models.subscription import Subscription
from app.models.link import Link
from app.api.endpoints.billing import TIER_LIMITS

async def check_link_quota(organization_id: uuid.UUID, db: AsyncSession):
    """
    Checks if the organization has reached its link generation limit.
    """
    # Get subscription
    sub_query = await db.execute(select(Subscription).where(Subscription.organization_id == organization_id))
    subscription = sub_query.scalars().first()
    
    tier = subscription.tier if subscription else "free"
    limits = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    
    max_links = limits["max_links"]
    if max_links == -1:
        return True # Unlimited
        
    # Count current links
    # For a real scalable app, you'd cache this count in Redis
    count_query = await db.execute(select(Link).where(Link.organization_id == organization_id))
    current_count = len(count_query.scalars().all())
    
    if current_count >= max_links:
        raise HTTPException(
            status_code=402, 
            detail=f"Link quota exceeded for {tier.upper()} tier. Please upgrade to generate more."
        )
        
    return True
