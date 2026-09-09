from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api import deps
from app.models.user import User
from app.models.task import Task, TaskStatus, TaskPriority
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
async def read_tasks(
    db: AsyncSession = Depends(deps.get_db),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve tasks for current user.
    """
    stmt = select(Task).where(Task.user_id == current_user.id).order_by(Task.created_at.desc())
    if status:
        stmt = stmt.where(Task.status == status.upper())
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=TaskResponse)
async def create_task(
    *,
    db: AsyncSession = Depends(deps.get_db),
    task_in: TaskCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new task.
    """
    priority_enum = TaskPriority.MEDIUM
    if task_in.priority:
        try:
            priority_enum = TaskPriority[task_in.priority.upper()]
        except KeyError:
            priority_enum = TaskPriority.MEDIUM

    status_enum = TaskStatus.PENDING
    if task_in.status:
        try:
            status_enum = TaskStatus[task_in.status.upper()]
        except KeyError:
            status_enum = TaskStatus.PENDING

    task = Task(
        user_id=current_user.id,
        source_email_id=task_in.source_email_id,
        title=task_in.title,
        description=task_in.description,
        deadline=task_in.deadline,
        priority=priority_enum,
        status=status_enum,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return task

@router.patch("/{id}", response_model=TaskResponse)
async def update_task(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: str,
    task_update: TaskUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a task status, title, or priority.
    """
    try:
        task_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    stmt = select(Task).where(Task.id == task_uuid, Task.user_id == current_user.id)
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.deadline is not None:
        task.deadline = task_update.deadline
    if task_update.priority is not None:
        try:
            task.priority = TaskPriority[task_update.priority.upper()]
        except KeyError:
            pass
    if task_update.status is not None:
        try:
            task.status = TaskStatus[task_update.status.upper()]
        except KeyError:
            pass

    await db.commit()
    await db.refresh(task)
    return task

@router.delete("/{id}")
async def delete_task(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete a task.
    """
    try:
        task_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid task ID format")

    stmt = select(Task).where(Task.id == task_uuid, Task.user_id == current_user.id)
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    return {"message": "Task deleted successfully"}
