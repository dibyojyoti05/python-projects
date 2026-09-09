import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_tasks_lifecycle(async_client: AsyncClient, auth_headers):
    # 1. Create task
    create_res = await async_client.post(
        "/api/v1/tasks/",
        json={
            "title": "Review Website Proposal",
            "description": "Finalize milestone budget breakdown",
            "priority": "HIGH",
            "status": "PENDING"
        },
        headers=auth_headers
    )
    assert create_res.status_code == 200
    task_data = create_res.json()
    assert task_data["title"] == "Review Website Proposal"
    assert task_data["priority"] == "HIGH"
    assert task_data["status"] == "PENDING"
    task_id = task_data["id"]

    # 2. List tasks
    list_res = await async_client.get("/api/v1/tasks/", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update task status
    update_res = await async_client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "COMPLETED"},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "COMPLETED"

    # 4. Delete task
    delete_res = await async_client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert delete_res.status_code == 200

    # Verify task is deleted
    final_list = await async_client.get("/api/v1/tasks/", headers=auth_headers)
    assert all(t["id"] != task_id for t in final_list.json())
