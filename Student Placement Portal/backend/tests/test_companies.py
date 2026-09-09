import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_companies(client: AsyncClient):
    res = await client.get("/api/v1/companies")
    assert res.status_code == 200
    companies = res.json()
    assert len(companies) >= 3
    names = [c["name"] for c in companies]
    assert "Google" in names
    assert "Microsoft" in names

import uuid

@pytest.mark.asyncio
async def test_recruiter_company_setup(client: AsyncClient):
    # 1. Register a new recruiter
    email = f"recruiter_{uuid.uuid4().hex[:6]}@techcorp.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "Password@123", "role": "RECRUITER"}
    )
    assert reg_res.status_code == 200

    
    # 2. Login
    login_res = await client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "Password@123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Initially, posting a job should fail because company is not set
    fail_job_res = await client.post(
        "/api/v1/jobs",
        headers=headers,
        json={"title": "Test Engineer", "description": "Test role", "location": "Remote"}
    )
    assert fail_job_res.status_code == 400

    # 4. Set up company
    comp_name = f"TechCorp_{uuid.uuid4().hex[:6]}"
    setup_res = await client.post(
        "/api/v1/companies/setup",
        headers=headers,
        json={
            "name": comp_name,
            "industry": "FinTech",
            "website": "https://techcorp.example.com",
            "headquarters": "Mumbai",
            "description": "Leading payments infrastructure provider"
        }
    )
    assert setup_res.status_code == 200
    profile_data = setup_res.json()
    assert profile_data["company"]["name"] == comp_name

    # 5. Now posting job should succeed
    job_res = await client.post(
        "/api/v1/jobs",
        headers=headers,
        json={
            "title": "Senior Backend Developer",
            "description": "Build high throughput payment gateways",
            "location": "Mumbai / Remote",
            "salary_range": "₹20,00,000 - ₹28,00,000 PA",
            "job_type": "Full-time"
        }
    )
    assert job_res.status_code == 200
    job = job_res.json()
    assert job["title"] == "Senior Backend Developer"
    assert job["company_name"] == comp_name

