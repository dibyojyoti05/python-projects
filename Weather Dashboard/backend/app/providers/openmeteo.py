import httpx
from typing import List
from datetime import datetime
from app.providers.base import WeatherProvider
from app.schemas.weather import CurrentWeather, LocationSearchItem, HourlyForecast, HourlyForecastItem, DailyForecast, DailyForecastItem

class OpenMeteoProvider(WeatherProvider):
    WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
    GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"

    WMO_CODES = {
        0: {"condition": "Clear sky", "icon": "sun"},
        1: {"condition": "Mainly clear", "icon": "cloud-sun"},
        2: {"condition": "Partly cloudy", "icon": "cloud-sun"},
        3: {"condition": "Overcast", "icon": "cloud"},
        45: {"condition": "Fog", "icon": "fog"},
        48: {"condition": "Depositing rime fog", "icon": "fog"},
        51: {"condition": "Light drizzle", "icon": "cloud-drizzle"},
        53: {"condition": "Moderate drizzle", "icon": "cloud-drizzle"},
        55: {"condition": "Dense drizzle", "icon": "cloud-drizzle"},
        61: {"condition": "Slight rain", "icon": "cloud-rain"},
        63: {"condition": "Moderate rain", "icon": "cloud-rain"},
        65: {"condition": "Heavy rain", "icon": "cloud-rain"},
        71: {"condition": "Slight snow fall", "icon": "cloud-snow"},
        73: {"condition": "Moderate snow fall", "icon": "cloud-snow"},
        75: {"condition": "Heavy snow fall", "icon": "cloud-snow"},
        95: {"condition": "Thunderstorm", "icon": "cloud-lightning"},
        96: {"condition": "Thunderstorm with slight hail", "icon": "cloud-lightning"},
        99: {"condition": "Thunderstorm with heavy hail", "icon": "cloud-lightning"},
    }

    def _get_unit_params(self, units: str) -> dict:
        if units == "imperial":
            return {
                "temperature_unit": "fahrenheit",
                "wind_speed_unit": "mph",
                "precipitation_unit": "inch",
            }
        return {} # OpenMeteo defaults to metric (celsius, kmh, mm)

    async def get_current_weather(self, lat: float, lon: float, units: str = "metric") -> CurrentWeather:
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m",
            **self._get_unit_params(units)
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.WEATHER_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            current = data.get("current", {})
            wmo_code = current.get("weather_code", 0)
            weather_meta = self.WMO_CODES.get(wmo_code, {"condition": "Unknown", "icon": "help-circle"})

            return CurrentWeather(
                temperature=current.get("temperature_2m", 0.0),
                feels_like=current.get("apparent_temperature", 0.0),
                condition=weather_meta["condition"],
                icon=weather_meta["icon"],
                humidity=current.get("relative_humidity_2m", 0),
                wind_speed=current.get("wind_speed_10m", 0.0),
                wind_direction=current.get("wind_direction_10m", 0.0),
                pressure=current.get("pressure_msl", 0),
                cloud_cover=current.get("cloud_cover", 0),
                visibility=None,
                uv_index=None
            )

    async def get_hourly_forecast(self, lat: float, lon: float, units: str = "metric") -> HourlyForecast:
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,uv_index",
            "forecast_days": 3,
            **self._get_unit_params(units)
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(self.WEATHER_URL, params=params)
            response.raise_for_status()
            data = response.json()

            hourly = data.get("hourly", {})
            times = hourly.get("time", [])
            
            items = []
            for i, t in enumerate(times):
                wmo_code = hourly.get("weather_code", [])[i] if i < len(hourly.get("weather_code", [])) else 0
                weather_meta = self.WMO_CODES.get(wmo_code, {"condition": "Unknown", "icon": "help-circle"})
                
                items.append(
                    HourlyForecastItem(
                        time=datetime.fromisoformat(t),
                        temperature=hourly.get("temperature_2m", [])[i] if i < len(hourly.get("temperature_2m", [])) else 0.0,
                        feels_like=hourly.get("apparent_temperature", [])[i] if i < len(hourly.get("apparent_temperature", [])) else 0.0,
                        condition=weather_meta["condition"],
                        icon=weather_meta["icon"],
                        precipitation_probability=hourly.get("precipitation_probability", [])[i] if hourly.get("precipitation_probability") else 0,
                        precipitation_amount=hourly.get("precipitation", [])[i] if hourly.get("precipitation") else 0.0,
                        wind_speed=hourly.get("wind_speed_10m", [])[i] if i < len(hourly.get("wind_speed_10m", [])) else 0.0,
                        uv_index=hourly.get("uv_index", [])[i] if hourly.get("uv_index") else None,
                    )
                )
            
            return HourlyForecast(hours=items)

    async def get_daily_forecast(self, lat: float, lon: float, units: str = "metric") -> DailyForecast:
        params = {
            "latitude": lat,
            "longitude": lon,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
            "timezone": "auto",
            "forecast_days": 7,
            **self._get_unit_params(units)
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(self.WEATHER_URL, params=params)
            response.raise_for_status()
            data = response.json()

            daily = data.get("daily", {})
            times = daily.get("time", [])
            
            items = []
            for i, t in enumerate(times):
                wmo_code = daily.get("weather_code", [])[i] if i < len(daily.get("weather_code", [])) else 0
                weather_meta = self.WMO_CODES.get(wmo_code, {"condition": "Unknown", "icon": "help-circle"})
                
                items.append(
                    DailyForecastItem(
                        time=datetime.fromisoformat(t),
                        temp_max=daily.get("temperature_2m_max", [])[i] if i < len(daily.get("temperature_2m_max", [])) else 0.0,
                        temp_min=daily.get("temperature_2m_min", [])[i] if i < len(daily.get("temperature_2m_min", [])) else 0.0,
                        condition=weather_meta["condition"],
                        icon=weather_meta["icon"],
                        precipitation_probability=daily.get("precipitation_probability_max", [])[i] if daily.get("precipitation_probability_max") else 0,
                        precipitation_amount=daily.get("precipitation_sum", [])[i] if daily.get("precipitation_sum") else 0.0,
                        wind_speed=daily.get("wind_speed_10m_max", [])[i] if i < len(daily.get("wind_speed_10m_max", [])) else 0.0,
                        uv_index=daily.get("uv_index_max", [])[i] if daily.get("uv_index_max") else None,
                        sunrise=datetime.fromisoformat(daily.get("sunrise", [])[i]),
                        sunset=datetime.fromisoformat(daily.get("sunset", [])[i]),
                    )
                )
            
            return DailyForecast(days=items)

    async def get_air_quality(self, lat: float, lon: float) -> dict:
        url = "https://air-quality-api.open-meteo.com/v1/air-quality"
        params = {
            "latitude": lat,
            "longitude": lon,
            "current": "european_aqi,pm10,pm2_5,nitrogen_dioxide,ozone,sulphur_dioxide"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get("current", {})

    async def search_locations(self, query: str) -> List[LocationSearchItem]:
        params = {
            "name": query,
            "count": 10,
            "language": "en",
            "format": "json"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.GEOCODING_URL, params=params)
            response.raise_for_status()
            data = response.json()
            
            results = data.get("results", [])
            
            return [
                LocationSearchItem(
                    id=item["id"],
                    name=item["name"],
                    admin1=item.get("admin1"),
                    country=item.get("country", "Unknown"),
                    latitude=item["latitude"],
                    longitude=item["longitude"],
                    timezone=item.get("timezone", "UTC")
                )
                for item in results
            ]
