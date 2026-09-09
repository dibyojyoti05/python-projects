from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies
from app.crud import crud_workspace
from app.schemas.workspace import Workspace, WorkspaceCreate, WorkspaceUpdate
from app.models.user import User

router = APIRouter()

@router.get("/", response_model=List[Workspace])
async def read_workspaces(
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Retrieve workspaces for current user.
    """
    workspaces = await crud_workspace.get_user_workspaces(db, user_id=current_user.id)
    return workspaces

@router.post("/", response_model=Workspace)
async def create_workspace(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    workspace_in: WorkspaceCreate,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Create new workspace.
    """
    workspace = await crud_workspace.create_workspace(db, obj_in=workspace_in, user_id=current_user.id)
    return workspace

@router.get("/{id}", response_model=Workspace)
async def read_workspace(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Get workspace by ID.
    """
    workspace = await crud_workspace.get_workspace(db, workspace_id=id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # TODO: Add check if user belongs to this workspace
    return workspace

@router.put("/{id}", response_model=Workspace)
async def update_workspace(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    workspace_in: WorkspaceUpdate,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Update a workspace.
    """
    workspace = await crud_workspace.get_workspace(db, workspace_id=id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # TODO: Add check if user is owner/admin of this workspace
    workspace = await crud_workspace.update_workspace(db, db_obj=workspace, obj_in=workspace_in)
    return workspace

@router.delete("/{id}", response_model=Workspace)
async def delete_workspace(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Delete a workspace.
    """
    workspace = await crud_workspace.get_workspace(db, workspace_id=id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    # TODO: Add check if user is owner
    workspace = await crud_workspace.delete_workspace(db, id=id)
    return workspace
