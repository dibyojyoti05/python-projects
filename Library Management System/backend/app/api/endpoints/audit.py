from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.audit import AuditLog
from app.models.user import User, UserRole
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class AuditLogSchema(BaseModel):
    id: int
    user_id: int | None
    action: str
    resource_type: str
    resource_id: int | None
    details: str | None
    created_at: datetime
    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditLogSchema])
async def get_audit_logs(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.check_role([UserRole.ADMIN]))
) -> Any:
    result = await db.execute(select(AuditLog).offset(skip).limit(limit))
    return result.scalars().all()
