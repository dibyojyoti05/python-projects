import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, models, schemas
from app.api import deps
from app.services.workflow_service import workflow_service

router = APIRouter()

@router.get("/", response_model=List[schemas.Workflow])
async def read_workflows(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Retrieve workflows for current user.
    """
    workflows = await crud.workflow.get_multi_by_user(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return workflows

@router.post("/", response_model=schemas.Workflow, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    *,
    db: AsyncSession = Depends(deps.get_db),
    workflow_in: schemas.WorkflowCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create new workflow.
    """
    workflow = await crud.workflow.create_with_user(
        db, obj_in=workflow_in, user_id=current_user.id
    )
    return workflow

@router.get("/{id}", response_model=schemas.Workflow)
async def get_workflow(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get workflow by ID.
    """
    wf = await crud.workflow.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return wf

@router.put("/{id}", response_model=schemas.Workflow)
async def update_workflow(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    workflow_in: schemas.WorkflowUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update workflow canvas nodes, edges, or metadata.
    """
    wf = await crud.workflow.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    wf = await crud.workflow.update(db, db_obj=wf, obj_in=workflow_in)
    return wf

@router.delete("/{id}", response_model=schemas.Workflow)
async def delete_workflow(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete workflow.
    """
    wf = await crud.workflow.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    await crud.workflow.remove(db, id=id)
    return wf

@router.post("/{id}/test-run", response_model=schemas.WorkflowTestResponse)
async def test_run_workflow(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: uuid.UUID,
    payload: schemas.WorkflowTestRequest,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Simulate dry-run execution of the visual workflow for verification.
    """
    wf = await crud.workflow.get_by_user_and_id(db, user_id=current_user.id, id=id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    nodes = wf.nodes if isinstance(wf.nodes, list) else []
    edges = wf.edges if isinstance(wf.edges, list) else []

    contact_context = {
        "email": payload.contact_email or "tester@example.com",
        "first_name": "Valued Customer",
        "opened_email": True,
        **(payload.contact_attributes or {}),
    }

    result = workflow_service.simulate_execution(nodes, edges, contact_context)
    return schemas.WorkflowTestResponse(
        success=result.get("success", False),
        steps_count=result.get("steps_count", 0),
        steps=result.get("steps", []),
        error=result.get("error"),
    )
