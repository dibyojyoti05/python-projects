import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_automation_rules_lifecycle(async_client: AsyncClient, auth_headers):
    # 1. Create rule
    create_res = await async_client.post(
        "/api/v1/automations/",
        json={
            "name": "Auto-flag Urgent Client Emails",
            "is_active": True,
            "conditions": {"category": "Client", "priority": "URGENT"},
            "actions": {"action_type": "CREATE_TASK", "task_title": "Address urgent client email"}
        },
        headers=auth_headers
    )
    assert create_res.status_code == 200
    rule_data = create_res.json()
    assert rule_data["name"] == "Auto-flag Urgent Client Emails"
    assert rule_data["is_active"] is True
    rule_id = rule_data["id"]

    # 2. List rules
    list_res = await async_client.get("/api/v1/automations/", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Toggle active
    toggle_res = await async_client.patch(f"/api/v1/automations/{rule_id}/toggle", headers=auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_active"] is False

    # 4. Delete rule
    delete_res = await async_client.delete(f"/api/v1/automations/{rule_id}", headers=auth_headers)
    assert delete_res.status_code == 200
