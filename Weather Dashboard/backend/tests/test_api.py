import pytest
import httpx
from app.main import app

@pytest.mark.asyncio
async def test_health():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"

@pytest.mark.asyncio
async def test_geocoding_search():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/geocoding/search?query=Paris")
        assert res.status_code == 200
        results = res.json()
        assert isinstance(results, list)
        assert len(results) > 0
        assert "Paris" in results[0]["name"]

@pytest.mark.asyncio
async def test_current_weather():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/weather/current?lat=51.5085&lon=-0.1257&units=metric")
        assert res.status_code == 200
        data = res.json()
        assert "temperature" in data
        assert isinstance(data["temperature"], (int, float))
        assert "pressure" in data
        assert isinstance(data["pressure"], (int, float))
        assert "condition" in data
        assert "humidity" in data

@pytest.mark.asyncio
async def test_hourly_forecast():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/weather/hourly?lat=51.5085&lon=-0.1257&units=metric")
        assert res.status_code == 200
        data = res.json()
        assert "hours" in data
        assert len(data["hours"]) > 0

@pytest.mark.asyncio
async def test_daily_forecast():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/weather/daily?lat=51.5085&lon=-0.1257&units=metric")
        assert res.status_code == 200
        data = res.json()
        assert "days" in data
        assert len(data["days"]) == 7

@pytest.mark.asyncio
async def test_air_quality():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/weather/air-quality?lat=51.5085&lon=-0.1257")
        assert res.status_code == 200
        data = res.json()
        assert isinstance(data, dict)

@pytest.mark.asyncio
async def test_favorites_crud():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create
        post_res = await client.post("/api/favorites/", json={
            "name": "Tokyo",
            "admin1": "Tokyo",
            "country": "Japan",
            "latitude": 35.6895,
            "longitude": 139.6917,
            "timezone": "Asia/Tokyo"
        })
        assert post_res.status_code == 201
        fav = post_res.json()
        fav_id = fav["id"]
        assert fav["name"] == "Tokyo"

        # List
        get_res = await client.get("/api/favorites/")
        assert get_res.status_code == 200
        items = get_res.json()
        assert any(i["id"] == fav_id for i in items)

        # Delete
        del_res = await client.delete(f"/api/favorites/{fav_id}")
        assert del_res.status_code == 204

@pytest.mark.asyncio
async def test_alerts_crud():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Create rule
        create_res = await client.post("/api/alerts/", json={
            "city_name": "New York",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "condition_type": "rain",
            "threshold": 30.0
        })
        assert create_res.status_code == 201
        alert = create_res.json()
        alert_id = alert["id"]

        # List rules
        list_res = await client.get("/api/alerts/")
        assert list_res.status_code == 200

        # Check rules evaluation
        check_res = await client.get("/api/alerts/check")
        assert check_res.status_code == 200
        assert isinstance(check_res.json(), list)

        # Delete rule
        del_res = await client.delete(f"/api/alerts/{alert_id}")
        assert del_res.status_code == 204

@pytest.mark.asyncio
async def test_ai_assistant():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.post("/api/ai/ask", json={
            "query": "What jacket should I wear?",
            "weather_context": "Tokyo: 16°C, Light drizzle, humidity 80%"
        })
        assert res.status_code == 200
        data = res.json()
        assert "response" in data
        assert len(data["response"]) > 0
