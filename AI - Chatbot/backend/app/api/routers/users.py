from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies
from app.schemas.user import User

router = APIRouter()

@router.get("/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Get current user.
    """
    return current_user
