from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List
from app.schemas.weather import LocationSearchItem
from app.providers.base import WeatherProvider
from app.services.weather_service import get_weather_provider

router = APIRouter(prefix="/api/geocoding", tags=["Geocoding"])

@router.get("/search", response_model=List[LocationSearchItem])
async def search_locations(
    query: str = Query(..., description="City or location name to search"),
    provider: WeatherProvider = Depends(get_weather_provider)
):
    if len(query) < 2:
        return []
    
    try:
        return await provider.search_locations(query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
