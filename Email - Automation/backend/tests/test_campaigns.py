import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_campaigns_lifecycle(client: AsyncClient, auth_headers: dict):
    # 1. Add a contact for testing delivery
    await client.post(
        "/api/v1/contacts/",
        json={
            "email": "recipient@example.com",
            "first_name": "TestSubscriber",
            "is_subscribed": True,
        },
        headers=auth_headers,
    )

    # 2. Create a campaign
    camp_res = await client.post(
        "/api/v1/campaigns/",
        json={
            "name": "Summer Special Flash Sale",
            "subject": "Hello {{ first_name }}, your exclusive discount is here!",
            "content_html": "<h1>Welcome {{ first_name }}</h1><p>Enjoy 30% off today.</p>",
            "content_text": "Welcome! Enjoy 30% off today.",
        },
        headers=auth_headers,
    )
    assert camp_res.status_code == 201
    campaign = camp_res.json()
    campaign_id = campaign["id"]

    # 3. Send test email
    test_email_res = await client.post(
        f"/api/v1/campaigns/{campaign_id}/test",
        json={"recipient_email": "preview@example.com"},
        headers=auth_headers,
    )
    assert test_email_res.status_code == 200
    assert test_email_res.json()["success"] is True

    # 4. Trigger full campaign send
    send_res = await client.post(
        f"/api/v1/campaigns/{campaign_id}/send",
        headers=auth_headers,
    )
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["status"] == "completed"
    assert send_data["sent_count"] >= 1

    # 5. Check stats
    stats_res = await client.get(
        f"/api/v1/campaigns/{campaign_id}/stats",
        headers=auth_headers,
    )
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["sent_count"] >= 1

    # 6. Test open tracking pixel
    track_res = await client.get(f"/api/v1/campaigns/{campaign_id}/track/open")
    assert track_res.status_code == 200
    assert track_res.headers["content-type"] == "image/gif"
