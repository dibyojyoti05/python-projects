from app.providers.base import WeatherProvider
from app.providers.openmeteo import OpenMeteoProvider

# Factory or Dependency Injection for the active provider
def get_weather_provider() -> WeatherProvider:
    # We can eventually switch based on settings here
    return OpenMeteoProvider()
