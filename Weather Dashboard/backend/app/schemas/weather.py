from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class CurrentWeather(BaseModel):
    temperature: float = Field(..., description="Current temperature")
    feels_like: float = Field(..., description="Feels-like temperature")
    condition: str = Field(..., description="Weather condition description")
    icon: str = Field(..., description="Weather icon code")
    humidity: float = Field(..., description="Relative humidity percentage")
    wind_speed: float = Field(..., description="Wind speed")
    wind_direction: float = Field(..., description="Wind direction in degrees")
    pressure: float = Field(..., description="Atmospheric pressure at sea level in hPa")
    visibility: Optional[float] = Field(None, description="Visibility in meters")
    cloud_cover: float = Field(..., description="Cloud cover percentage")
    uv_index: Optional[float] = Field(None, description="UV Index")

class HourlyForecastItem(BaseModel):
    time: datetime
    temperature: float
    feels_like: float
    condition: str
    icon: str
    precipitation_probability: float
    precipitation_amount: float
    wind_speed: float
    uv_index: Optional[float] = None

class HourlyForecast(BaseModel):
    hours: List[HourlyForecastItem]

class DailyForecastItem(BaseModel):
    time: datetime
    temp_max: float
    temp_min: float
    condition: str
    icon: str
    precipitation_probability: float
    precipitation_amount: float
    wind_speed: float
    uv_index: Optional[float] = None
    sunrise: datetime
    sunset: datetime

class DailyForecast(BaseModel):
    days: List[DailyForecastItem]

class LocationSearchItem(BaseModel):
    id: int
    name: str
    admin1: Optional[str] = Field(None, description="State/Region")
    country: str
    latitude: float
    longitude: float
    timezone: str

class LocationSearchResponse(BaseModel):
    results: List[LocationSearchItem]

class FavoriteCreate(BaseModel):
    name: str
    admin1: Optional[str] = None
    country: str
    latitude: float
    longitude: float
    timezone: str = "UTC"
    notes: Optional[str] = None

class FavoriteResponse(BaseModel):
    id: int
    name: str
    admin1: Optional[str] = None
    country: str
    latitude: float
    longitude: float
    timezone: str
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertRuleCreate(BaseModel):
    city_name: str
    latitude: float
    longitude: float
    condition_type: str = Field(..., description="'rain', 'temp_high', 'temp_low', or 'wind'")
    threshold: float = Field(..., description="Numerical threshold e.g. 50% for rain or 35 for temp")

class AlertRuleResponse(BaseModel):
    id: int
    city_name: str
    latitude: float
    longitude: float
    condition_type: str
    threshold: float
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TriggeredAlert(BaseModel):
    rule_id: int
    city_name: str
    condition_type: str
    threshold: float
    current_value: float
    message: str
