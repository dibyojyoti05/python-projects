import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(async_client: AsyncClient):
    response = await async_client.post(
        "/api/v1/auth/register",
        json={"email": "newuser@example.com", "password": "securepassword123", "full_name": "New User"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"
    assert "id" in data

@pytest.mark.asyncio
async def test_register_duplicate_email(async_client: AsyncClient, test_user):
    response = await async_client.post(
        "/api/v1/auth/register",
        json={"email": test_user.email, "password": "securepassword123", "full_name": "Duplicate"}
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_login_user(async_client: AsyncClient, test_user):
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_password(async_client: AsyncClient, test_user):
    response = await async_client.post(
        "/api/v1/auth/login",
        data={"username": test_user.email, "password": "wrongpassword"}
    )
    assert response.status_code == 400

@pytest.mark.asyncio
async def test_get_current_user_me(async_client: AsyncClient, auth_headers):
    response = await async_client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "demo@mailmind.ai"
