from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.crud.base import CRUDBase
from app.models.campaign import Campaign, CampaignStatus
from app.schemas.campaign import CampaignCreate, CampaignUpdate

class CRUDCampaign(CRUDBase[Campaign, CampaignCreate, CampaignUpdate]):
    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[Campaign]:
        query = select(self.model).filter(self.model.user_id == user_id).order_by(self.model.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_user_and_id(
        self, db: AsyncSession, *, user_id: uuid.UUID, id: uuid.UUID
    ) -> Optional[Campaign]:
        query = select(self.model).filter(self.model.user_id == user_id, self.model.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def create_with_user(
        self, db: AsyncSession, *, obj_in: CampaignCreate, user_id: uuid.UUID
    ) -> Campaign:
        db_obj = self.model(**obj_in.model_dump(), user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def count_by_user(self, db: AsyncSession, *, user_id: uuid.UUID) -> int:
        query = select(func.count()).select_from(self.model).filter(self.model.user_id == user_id)
        result = await db.execute(query)
        return result.scalar() or 0

campaign = CRUDCampaign(Campaign)
