import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_workflows_lifecycle(client: AsyncClient, auth_headers: dict):
    # 1. Create a workflow
    nodes = [
        {"id": "1", "type": "input", "data": {"label": "Trigger: New Subscriber"}},
        {"id": "2", "type": "default", "data": {"label": "Send Welcome Email"}},
        {"id": "3", "type": "default", "data": {"label": "Condition: Opened Email?"}},
        {"id": "4", "type": "output", "data": {"label": "Send Promo Coupon"}},
    ]
    edges = [
        {"id": "e1-2", "source": "1", "target": "2"},
        {"id": "e2-3", "source": "2", "target": "3"},
        {"id": "e3-4", "source": "3", "target": "4", "label": "Yes"},
    ]

    create_res = await client.post(
        "/api/v1/workflows/",
        json={
            "name": "Onboarding Nurture Automation",
            "description": "Engage new signups with welcome series",
            "nodes": nodes,
            "edges": edges,
            "status": "active",
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    wf = create_res.json()
    wf_id = wf["id"]
    assert wf["name"] == "Onboarding Nurture Automation"

    # 2. Test-run simulation
    test_res = await client.post(
        f"/api/v1/workflows/{wf_id}/test-run",
        json={"contact_email": "subscriber@domain.com"},
        headers=auth_headers,
    )
    assert test_res.status_code == 200
    test_data = test_res.json()
    assert test_data["success"] is True
    assert test_data["steps_count"] >= 3

    # 3. Update workflow
    update_res = await client.put(
        f"/api/v1/workflows/{wf_id}",
        json={"status": "paused"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "paused"
