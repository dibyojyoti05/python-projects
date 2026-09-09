from typing import List, Optional, Tuple
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.crud.base import CRUDBase
from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate

class CRUDContact(CRUDBase[Contact, ContactCreate, ContactUpdate]):
    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: uuid.UUID, skip: int = 0, limit: int = 100, search: Optional[str] = None, status: Optional[str] = None
    ) -> List[Contact]:
        query = select(self.model).filter(self.model.user_id == user_id)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    self.model.email.ilike(search_pattern),
                    self.model.first_name.ilike(search_pattern),
                    self.model.last_name.ilike(search_pattern),
                )
            )
        if status == "subscribed":
            query = query.filter(self.model.is_subscribed == True, self.model.is_blacklisted == False)
        elif status == "unsubscribed":
            query = query.filter(self.model.is_subscribed == False)
        elif status == "bounced" or status == "blacklisted":
            query = query.filter(self.model.is_blacklisted == True)

        query = query.order_by(self.model.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_user_and_id(
        self, db: AsyncSession, *, user_id: uuid.UUID, id: uuid.UUID
    ) -> Optional[Contact]:
        query = select(self.model).filter(self.model.user_id == user_id, self.model.id == id)
        result = await db.execute(query)
        return result.scalars().first()

    async def get_by_email_and_user(
        self, db: AsyncSession, *, email: str, user_id: uuid.UUID
    ) -> Optional[Contact]:
        query = select(self.model).filter(self.model.user_id == user_id, self.model.email == email)
        result = await db.execute(query)
        return result.scalars().first()

    async def create_with_user(
        self, db: AsyncSession, *, obj_in: ContactCreate, user_id: uuid.UUID
    ) -> Contact:
        db_obj = self.model(**obj_in.model_dump(), user_id=user_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def count_by_user(self, db: AsyncSession, *, user_id: uuid.UUID) -> int:
        query = select(func.count()).select_from(self.model).filter(self.model.user_id == user_id)
        result = await db.execute(query)
        return result.scalar() or 0

    async def bulk_import(
        self, db: AsyncSession, *, contacts_in: List[ContactCreate], user_id: uuid.UUID
    ) -> Tuple[int, int]:
        imported = 0
        skipped = 0
        for c in contacts_in:
            existing = await self.get_by_email_and_user(db, email=c.email, user_id=user_id)
            if existing:
                skipped += 1
            else:
                db_obj = self.model(**c.model_dump(), user_id=user_id)
                db.add(db_obj)
                imported += 1
        if imported > 0:
            await db.commit()
        return imported, skipped

contact = CRUDContact(Contact)
