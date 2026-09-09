import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_login_existing_admin(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin@placement.edu", "password": "Admin@123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_auth_me(client: AsyncClient):
    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "student1@placement.edu", "password": "Student@123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 2. Get me
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == "student1@placement.edu"
    assert me_data["role"] == "STUDENT"
