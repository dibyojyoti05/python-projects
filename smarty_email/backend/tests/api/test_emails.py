import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_seed_and_list_emails(async_client: AsyncClient, auth_headers):
    # 1. Seed demo emails
    seed_res = await async_client.post("/api/v1/emails/seed-demo", headers=auth_headers)
    assert seed_res.status_code == 200

    # 2. List all emails
    list_res = await async_client.get("/api/v1/emails/", headers=auth_headers)
    assert list_res.status_code == 200
    emails = list_res.json()
    assert len(emails) >= 4

    # Check analysis fields on first email
    first_email = emails[0]
    assert "analysis" in first_email
    assert first_email["analysis"] is not None
    assert "category" in first_email["analysis"]
    email_id = first_email["id"]

    # 3. Read single email
    single_res = await async_client.get(f"/api/v1/emails/{email_id}", headers=auth_headers)
    assert single_res.status_code == 200
    assert single_res.json()["id"] == email_id

    # 4. Filter by urgent
    urgent_res = await async_client.get("/api/v1/emails/?filter=urgent", headers=auth_headers)
    assert urgent_res.status_code == 200
    for em in urgent_res.json():
        assert em["analysis"]["priority"] == "URGENT"

    # 5. Patch email read and starred status
    patch_res = await async_client.patch(
        f"/api/v1/emails/{email_id}",
        json={"is_read": True, "is_starred": True},
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_read"] is True
    assert patch_res.json()["is_starred"] is True

    # 6. Check summary stats
    stats_res = await async_client.get("/api/v1/emails/stats/summary", headers=auth_headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total"] >= 4
    assert stats["urgent"] >= 1
