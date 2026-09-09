from abc import ABC, abstractmethod
from typing import List
from app.schemas.weather import CurrentWeather, LocationSearchItem, HourlyForecast, DailyForecast

class WeatherProvider(ABC):
    @abstractmethod
    async def get_current_weather(self, lat: float, lon: float, units: str = "metric") -> CurrentWeather:
        """Fetch current weather for given coordinates."""
        pass

    @abstractmethod
    async def get_hourly_forecast(self, lat: float, lon: float, units: str = "metric") -> HourlyForecast:
        """Fetch hourly forecast."""
        pass

    @abstractmethod
    async def get_daily_forecast(self, lat: float, lon: float, units: str = "metric") -> DailyForecast:
        """Fetch daily forecast."""
        pass

    @abstractmethod
    async def get_air_quality(self, lat: float, lon: float) -> dict:
        """Fetch air quality."""
        pass

    @abstractmethod
    async def search_locations(self, query: str) -> List[LocationSearchItem]:
        """Search for locations by name."""
        pass
