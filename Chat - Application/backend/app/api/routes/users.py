from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserPublic, UserUpdate
from app.api.dependencies.auth import get_current_active_user

router = APIRouter()

@router.get("/me", response_model=UserPublic)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.patch("/me", response_model=UserPublic)
async def update_me(
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if user_in.display_name is not None:
        current_user.display_name = user_in.display_name
    if user_in.bio is not None:
        current_user.bio = user_in.bio
    if user_in.profile_photo is not None:
        current_user.profile_photo = user_in.profile_photo

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/search", response_model=List[UserPublic])
async def search_users(
    query: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    search = f"%{query}%"
    stmt = select(User).where(
        (User.username.ilike(search)) | (User.display_name.ilike(search))
    ).where(User.id != current_user.id).limit(20)
    
    result = await db.execute(stmt)
    users = result.scalars().all()
    return users
