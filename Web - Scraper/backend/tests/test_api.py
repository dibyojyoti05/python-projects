import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app

@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_root_endpoint(async_client):
    response = await async_client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"

@pytest.mark.asyncio
async def test_dashboard_stats(async_client):
    response = await async_client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_scrapers" in data
    assert "active_jobs" in data
    assert "success_rate" in data

@pytest.mark.asyncio
async def test_list_scrapers(async_client):
    response = await async_client.get("/api/v1/scrapers/")
    assert response.status_code == 200
    scrapers = response.json()
    assert isinstance(scrapers, list)
    assert len(scrapers) >= 1

@pytest.mark.asyncio
async def test_create_and_delete_scraper(async_client):
    new_scraper = {
        "name": "Pytest Temp Scraper",
        "description": "Testing scraper creation",
        "start_url": "https://example.com",
        "scraper_type": "http",
        "max_depth": 1,
        "extraction_schema": {
            "title": {"type": "css", "selector": "h1", "attribute": "text"}
        }
    }
    create_resp = await async_client.post("/api/v1/scrapers/", json=new_scraper)
    assert create_resp.status_code == 201
    created = create_resp.json()
    scraper_id = created["id"]
    assert created["name"] == "Pytest Temp Scraper"

    # Delete
    del_resp = await async_client.delete(f"/api/v1/scrapers/{scraper_id}")
    assert del_resp.status_code == 204

@pytest.mark.asyncio
async def test_ai_suggest_selectors(async_client):
    sample_snippet = """
    <div class="card">
        <h1 class="product-name">Super Laptop X</h1>
        <span class="price-tag">$1,200</span>
    </div>
    """
    payload = {
        "html_snippet": sample_snippet,
        "target_fields": ["title", "price"]
    }
    response = await async_client.post("/api/v1/ai/suggest-selectors", json=payload)
    assert response.status_code == 200
    selectors = response.json()
    assert "title" in selectors
    assert "price" in selectors
