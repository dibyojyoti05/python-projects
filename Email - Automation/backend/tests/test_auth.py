import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # Test registration
    reg_response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecurePassword123!",
            "full_name": "New Platform User",
        },
    )
    assert reg_response.status_code == 200
    data = reg_response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New Platform User"

    # Test login via JSON endpoint
    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "newuser@example.com", "password": "SecurePassword123!"},
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Test /auth/me
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_response = await client.get("/api/v1/auth/me", headers=headers)
    assert me_response.status_code == 200
    user_info = me_response.json()
    assert user_info["email"] == "newuser@example.com"
