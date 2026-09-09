import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_read_root():
    # pyrefly: ignore [unexpected-keyword]
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the Enterprise AI Assistant API"}

@pytest.mark.asyncio
async def test_read_workspaces_unauthorized():
    # pyrefly: ignore [unexpected-keyword]
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/v1/workspaces/")
    assert response.status_code == 401
