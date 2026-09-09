from fastapi import APIRouter, Depends, HTTPException, Query
from app.schemas.weather import CurrentWeather
from app.providers.base import WeatherProvider
from app.services.weather_service import get_weather_provider

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("/current", response_model=CurrentWeather)
async def get_current_weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", description="Unit system: metric or imperial"),
    provider: WeatherProvider = Depends(get_weather_provider)
):
    try:
        return await provider.get_current_weather(lat, lon, units)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/hourly")
async def get_hourly_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", description="Unit system: metric or imperial"),
    provider: WeatherProvider = Depends(get_weather_provider)
):
    try:
        return await provider.get_hourly_forecast(lat, lon, units)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/daily")
async def get_daily_forecast(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", description="Unit system: metric or imperial"),
    provider: WeatherProvider = Depends(get_weather_provider)
):
    try:
        return await provider.get_daily_forecast(lat, lon, units)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/air-quality")
async def get_air_quality(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    provider: WeatherProvider = Depends(get_weather_provider)
):
    try:
        # Assuming we update WeatherProvider ABC to include get_air_quality or we just use OpenMeteo directly
        return await provider.get_air_quality(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
