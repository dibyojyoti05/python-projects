import pytest
import os
from httpx import AsyncClient, ASGITransport
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.main import app
from app.core.database import Base, get_db

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_chat.db"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True, scope="function")
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

async def test_register_and_login(async_client: AsyncClient):
    # Register
    username = f"user_{uuid.uuid4().hex[:8]}"
    response = await async_client.post("/api/v1/auth/register", json={
        "email": f"{username}@example.com",
        "username": username,
        "password": "password123",
        "display_name": "Test User"
    })
    assert response.status_code == 201
    
    # Login
    login_res = await async_client.post("/api/v1/auth/login", data={
        "username": username,
        "password": "password123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None

async def test_unauthorized_access(async_client: AsyncClient):
    # Create two users
    u1 = f"user_{uuid.uuid4().hex[:8]}"
    u2 = f"user_{uuid.uuid4().hex[:8]}"
    
    await async_client.post("/api/v1/auth/register", json={"email": f"{u1}@a.com", "username": u1, "password": "pw"})
    await async_client.post("/api/v1/auth/register", json={"email": f"{u2}@a.com", "username": u2, "password": "pw"})
    
    res1 = await async_client.post("/api/v1/auth/login", data={"username": u1, "password": "pw"})
    token1 = res1.json()["access_token"]
    
    res2 = await async_client.post("/api/v1/auth/login", data={"username": u2, "password": "pw"})
    token2 = res2.json()["access_token"]
    
    # U1 tries to create conversation with U2
    u2_data = await async_client.get(f"/api/v1/users/search?query={u2}", headers={"Authorization": f"Bearer {token1}"})
    u2_id = u2_data.json()[0]["id"]
    
    conv_res = await async_client.post("/api/v1/conversations/", json={"participant_id": u2_id}, headers={"Authorization": f"Bearer {token1}"})
    conv_id = conv_res.json()["id"]
    
    # U3 attempts to read the conversation
    u3 = f"user_{uuid.uuid4().hex[:8]}"
    await async_client.post("/api/v1/auth/register", json={"email": f"{u3}@a.com", "username": u3, "password": "pw"})
    res3 = await async_client.post("/api/v1/auth/login", data={"username": u3, "password": "pw"})
    token3 = res3.json()["access_token"]
    
    bad_req = await async_client.get(f"/api/v1/conversations/{conv_id}/messages", headers={"Authorization": f"Bearer {token3}"})
    assert bad_req.status_code == 403 # U3 is not a member!
