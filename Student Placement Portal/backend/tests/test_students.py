import pytest
from httpx import AsyncClient
import uuid


@pytest.mark.asyncio
async def test_student_profile_and_duplicate_prevention(client: AsyncClient):
    # 1. Register a new student
    email = f"student_{uuid.uuid4().hex[:6]}@placement.edu"
    await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password@123", "role": "STUDENT"}
    )

    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password@123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Update Student Profile
    patch_res = await client.patch(
        "/api/v1/students/me",
        headers=headers,
        json={
            "first_name": "Kavya",
            "last_name": "Iyer",
            "college": "BITS Goa",
            "department": "Computer Science",
            "graduation_year": 2026,
            "cgpa": 9.4
        }
    )
    assert patch_res.status_code == 200
    p = patch_res.json()
    assert p["first_name"] == "Kavya"
    assert p["cgpa"] == 9.4

    # 3. Find an active job
    jobs_res = await client.get("/api/v1/jobs")
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) > 0
    target_job = jobs[0]

    # 4. Apply for job
    apply_res = await client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": target_job["id"]}
    )
    assert apply_res.status_code == 200
    app_data = apply_res.json()
    assert app_data["job_id"] == target_job["id"]
    assert app_data["status"] == "Pending"

    # 5. Try to apply for the same job again -> should fail with 400
    dup_res = await client.post(
        "/api/v1/applications",
        headers=headers,
        json={"job_id": target_job["id"]}
    )
    assert dup_res.status_code == 400
    assert "Already applied" in dup_res.json()["detail"]
