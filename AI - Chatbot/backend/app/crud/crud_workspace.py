from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.workspace import Workspace, WorkspaceUser
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate

async def get_workspace(db: AsyncSession, workspace_id: int) -> Optional[Workspace]:
    result = await db.execute(select(Workspace).filter(Workspace.id == workspace_id))
    return result.scalars().first()

async def get_user_workspaces(db: AsyncSession, user_id: int) -> List[Workspace]:
    # Need to join with WorkspaceUser
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceUser)
        .filter(WorkspaceUser.user_id == user_id)
    )
    return list(result.scalars().all())

async def create_workspace(db: AsyncSession, obj_in: WorkspaceCreate, user_id: int) -> Workspace:
    db_obj = Workspace(
        name=obj_in.name,
        description=obj_in.description
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    
    # Add creator as owner
    ws_user = WorkspaceUser(workspace_id=db_obj.id, user_id=user_id, role="owner")
    db.add(ws_user)
    await db.commit()
    
    return db_obj

async def update_workspace(
    db: AsyncSession, db_obj: Workspace, obj_in: WorkspaceUpdate
) -> Workspace:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_workspace(db: AsyncSession, id: int) -> Workspace:
    obj = await get_workspace(db, workspace_id=id)
    if obj:
        await db.delete(obj)
        await db.commit()
    return obj
