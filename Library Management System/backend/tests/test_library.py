import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_auth_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Test admin login
        response = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin@library.com", "password": "Admin@123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_dashboard_stats():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin@library.com", "password": "Admin@123"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await ac.get("/api/v1/dashboard/stats", headers=headers)
        assert response.status_code == 200
        stats = response.json()
        assert stats["total_books"] > 0
        assert stats["total_copies"] > 0
        assert "circulation_trends" in stats

@pytest.mark.asyncio
async def test_books_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/v1/books/?q=Clean")
        assert response.status_code == 200
        books = response.json()
        assert len(books) >= 1
        assert "Clean Code" in books[0]["title"]

@pytest.mark.asyncio
async def test_circulation_loans():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin@library.com", "password": "Admin@123"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await ac.get("/api/v1/circulation/loans", headers=headers)
        assert response.status_code == 200
        loans = response.json()
        assert len(loans) >= 1
        assert "copy_barcode" in loans[0]
        assert "book_title" in loans[0]

@pytest.mark.asyncio
async def test_ai_query():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin@library.com", "password": "Admin@123"}
        )
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        response = await ac.post(
            "/api/v1/ai/ask",
            json={"query": "Do you have 1984 in the catalog?"},
            headers=headers
        )
        assert response.status_code == 200
        res = response.json()
        assert "1984" in res["answer"]
