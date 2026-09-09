import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_dashboard_overview(client: AsyncClient, auth_headers: dict):
    res = await client.get("/api/v1/dashboard/overview", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "stats" in data
    assert "chart_data" in data
    assert "recent_activity" in data
    assert len(data["stats"]) == 4
    assert len(data["chart_data"]) == 7
