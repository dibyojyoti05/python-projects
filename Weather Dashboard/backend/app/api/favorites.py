from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.favorite import FavoriteCity
from app.schemas.weather import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/api/favorites", tags=["Favorites"])

@router.get("/", response_model=List[FavoriteResponse])
async def list_favorites(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FavoriteCity).order_by(FavoriteCity.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(fav_in: FavoriteCreate, db: AsyncSession = Depends(get_db)):
    # Check if duplicate exists (same name & country)
    existing = await db.execute(
        select(FavoriteCity).where(
            FavoriteCity.name == fav_in.name,
            FavoriteCity.country == fav_in.country
        )
    )
    fav = existing.scalar_one_or_none()
    if fav:
        return fav
    
    new_fav = FavoriteCity(
        name=fav_in.name,
        admin1=fav_in.admin1,
        country=fav_in.country,
        latitude=fav_in.latitude,
        longitude=fav_in.longitude,
        timezone=fav_in.timezone,
        notes=fav_in.notes
    )
    db.add(new_fav)
    await db.commit()
    await db.refresh(new_fav)
    return new_fav

@router.delete("/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_favorite(favorite_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(FavoriteCity).where(FavoriteCity.id == favorite_id))
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite location not found")
    await db.delete(fav)
    await db.commit()
    return None
