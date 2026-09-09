import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_assistant_chat_flow(async_client: AsyncClient, auth_headers):
    # Seed emails first
    await async_client.post("/api/v1/emails/seed-demo", headers=auth_headers)

    # Ask assistant about client questions
    res = await async_client.post(
        "/api/v1/assistant/chat",
        json={"message": "Which clients need a response?"},
        headers=auth_headers
    )
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 10
    assert "citations" in data
    assert len(data["citations"]) >= 1

    # Ask assistant about interviews
    res_int = await async_client.post(
        "/api/v1/assistant/chat",
        json={"message": "Do I have any interviews scheduled?"},
        headers=auth_headers
    )
    assert res_int.status_code == 200
    assert "interview" in res_int.json()["reply"].lower()

@pytest.mark.asyncio
async def test_search_emails_flow(async_client: AsyncClient, auth_headers):
    await async_client.post("/api/v1/emails/seed-demo", headers=auth_headers)

    # Search for "proposal"
    res = await async_client.get("/api/v1/search/?q=proposal", headers=auth_headers)
    assert res.status_code == 200
    results = res.json()
    assert len(results) >= 1
    assert any("proposal" in r["subject"].lower() or "proposal" in r["body_text"].lower() for r in results)
