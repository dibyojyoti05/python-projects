from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.crud.base import CRUDBase
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate

class CRUDWorkflow(CRUDBase[Workflow, WorkflowCreate, WorkflowUpdate]):
    async def create_with_user(
        self, db: AsyncSession, *, obj_in: WorkflowCreate, user_id: UUID
    ) -> Workflow:
        db_obj = self.model(
            name=obj_in.name,
            description=obj_in.description,
            nodes=obj_in.nodes,
            edges=obj_in.edges,
            status=obj_in.status,
            user_id=user_id,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Workflow]:
        query = select(self.model).filter(self.model.user_id == user_id).order_by(self.model.created_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_by_user_and_id(
        self, db: AsyncSession, *, user_id: UUID, id: UUID
    ) -> Optional[Workflow]:
        query = select(self.model).filter(self.model.user_id == user_id, self.model.id == id)
        result = await db.execute(query)
        return result.scalars().first()

workflow = CRUDWorkflow(Workflow)
