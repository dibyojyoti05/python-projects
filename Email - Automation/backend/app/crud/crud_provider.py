from typing import List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.provider import EmailProvider
from app.schemas.provider import ProviderCreate, ProviderUpdate

class CRUDProvider(CRUDBase[EmailProvider, ProviderCreate, ProviderUpdate]):
    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> List[EmailProvider]:
        query = select(self.model).filter(self.model.user_id == user_id).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_user_and_id(
        self, db: AsyncSession, *, user_id: uuid.UUID, id: uuid.UUID
    ) -> Optional[EmailProvider]:
        query = select(self.model).filter(self.model.user_id == user_id, self.model.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def create_with_user(
        self, db: AsyncSession, *, obj_in: ProviderCreate, user_id: uuid.UUID
    ) -> EmailProvider:
        db_obj = self.model(**obj_in.model_dump(), user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

provider = CRUDProvider(EmailProvider)
