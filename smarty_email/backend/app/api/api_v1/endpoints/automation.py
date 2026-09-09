from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.api import deps
from app.models.user import User
from app.models.automation import AutomationRule
from app.schemas.automation import (
    AutomationRuleCreate,
    AutomationRuleUpdate,
    AutomationRuleResponse,
)

router = APIRouter()

@router.get("/", response_model=List[AutomationRuleResponse])
async def get_automations(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    List automation rules for current user.
    """
    stmt = (
        select(AutomationRule)
        .where(AutomationRule.user_id == current_user.id)
        .order_by(AutomationRule.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=AutomationRuleResponse)
async def create_automation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    rule_in: AutomationRuleCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create a new automation rule.
    """
    rule = AutomationRule(
        user_id=current_user.id,
        name=rule_in.name,
        is_active=rule_in.is_active,
        conditions=rule_in.conditions,
        actions=rule_in.actions,
    )
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule

@router.patch("/{id}/toggle", response_model=AutomationRuleResponse)
async def toggle_automation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Toggle rule active state.
    """
    try:
        rule_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid rule ID format")

    stmt = select(AutomationRule).where(
        AutomationRule.id == rule_uuid,
        AutomationRule.user_id == current_user.id
    )
    result = await db.execute(stmt)
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    rule.is_active = not rule.is_active
    await db.commit()
    await db.refresh(rule)
    return rule

@router.delete("/{id}")
async def delete_automation(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete an automation rule.
    """
    try:
        rule_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid rule ID format")

    stmt = select(AutomationRule).where(
        AutomationRule.id == rule_uuid,
        AutomationRule.user_id == current_user.id
    )
    result = await db.execute(stmt)
    rule = result.scalars().first()
    if not rule:
        raise HTTPException(status_code=404, detail="Automation rule not found")

    await db.delete(rule)
    await db.commit()
    return {"message": "Automation rule deleted successfully"}
