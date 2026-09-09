import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_recruiter_workflow(client: AsyncClient):
    # 1. Login as Recruiter
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "recruiter@google.com", "password": "Recruiter@123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Check Recruiter Company Profile
    comp_res = await client.get("/api/v1/companies/me", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["company"]["name"] == "Google"

    # 3. Check Recruiter Company Jobs
    jobs_res = await client.get("/api/v1/jobs/company/me", headers=headers)
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) >= 2
    job_id = jobs[0]["id"]

    # 4. View Applicants for this job
    app_res = await client.get(f"/api/v1/applications/job/{job_id}", headers=headers)
    assert app_res.status_code == 200
    applicants = app_res.json()
    assert len(applicants) >= 1
    applicant = applicants[0]
    assert applicant["student_name"] is not None
    assert applicant["student_email"] is not None

    # 5. Update Applicant status to 'Shortlisted'
    status_res = await client.patch(
        f"/api/v1/applications/{applicant['id']}/status",
        headers=headers,
        json={"status": "Shortlisted", "notes": "Impressive technical portfolio."}
    )
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Shortlisted"

@pytest.mark.asyncio
async def test_student_workflow(client: AsyncClient):
    # 1. Login as Student
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": "student1@placement.edu", "password": "Student@123"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Student Profile
    prof_res = await client.get("/api/v1/students/me", headers=headers)
    assert prof_res.status_code == 200
    prof = prof_res.json()
    assert prof["first_name"] == "Aarav"
    assert prof["college"] == "Indian Institute of Technology, Delhi"

    # 3. Browse Available Jobs
    jobs_res = await client.get("/api/v1/jobs", headers=headers)
    assert jobs_res.status_code == 200
    jobs = jobs_res.json()
    assert len(jobs) >= 5
    assert jobs[0]["company_name"] is not None

    # 4. Check My Applications
    my_apps_res = await client.get("/api/v1/applications/me", headers=headers)
    assert my_apps_res.status_code == 200
    my_apps = my_apps_res.json()
    assert len(my_apps) >= 1
    assert my_apps[0]["job_title"] is not None
    assert my_apps[0]["company_name"] is not None

    # 5. Check Dashboard Stats
    stats_res = await client.get("/api/v1/dashboard/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["role"] == "STUDENT"
    assert stats["metrics"]["total_applications"] >= 1
    assert stats["metrics"]["profile_complete"] is True
