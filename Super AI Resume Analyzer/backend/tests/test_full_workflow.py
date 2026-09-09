import io
import time
import pytest

SAMPLE_RESUME_TEXT = """
Alex Morgan
Senior Full Stack & AI Engineer
Email: alex.morgan@example.com | Phone: +1-555-0199 | San Francisco, CA

Professional Summary
Experienced Software Engineer with 5+ years specializing in Python, FastAPI, React, PostgreSQL, Docker, and AWS. Demonstrated track record building high-throughput microservices and deploying machine learning pipelines.

Technical Skills
Languages: Python, JavaScript, TypeScript, SQL, Bash
Frameworks: FastAPI, Django, React, Next.js, Node.js
Databases: PostgreSQL, Redis, MongoDB
DevOps & Cloud: Docker, Kubernetes, AWS, CI/CD, Git
AI & ML: PyTorch, Scikit-Learn, NLP, Sentence-Transformers

Work Experience
Senior Backend Engineer | TechNova Solutions (2022 - Present)
- Architected and deployed microservices handling 50,000 requests per second using FastAPI and Redis.
- Designed scalable PostgreSQL schemas and optimized database queries, reducing API latency by 45%.
- Led continuous integration and automated deployment pipelines with Docker and AWS ECS.

Software Engineer | CloudScale Systems (2020 - 2022)
- Built responsive user dashboards in React and Next.js, increasing user retention by 30%.
- Implemented real-time data streaming pipelines using Python, WebSockets, and Redis.
- Collaborated across agile squads to design and test RESTful API services.

Education
Bachelor of Science in Computer Science | University of California, Berkeley (2016 - 2020)
"""

SAMPLE_JOB_DESCRIPTION = """
Senior Python Developer
Company: Horizon AI Labs

About the Role:
We are seeking an experienced Senior Python Developer to join our backend platform team. You will lead the engineering of core AI inference services, high-speed data pipelines, and scalable APIs.

Requirements:
- 4+ years of professional experience writing Python backend services.
- Extensive proficiency with FastAPI, PostgreSQL, Docker, and AWS.
- Familiarity with Redis caching and asynchronous programming.
- Solid understanding of Git, CI/CD workflows, and automated testing.

Preferred Qualifications:
- Experience with Kubernetes and microservice architectures.
- Familiarity with Machine Learning workflows, PyTorch, and NLP embeddings.
"""

def test_root_endpoint(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "message" in res.json()

def test_full_application_workflow(client):
    # 1. Register a unique test user
    timestamp = int(time.time() * 1000)
    email = f"testuser_{timestamp}@example.com"
    password = "SecurePassword123!"

    reg_res = client.post("/api/auth/register", json={"email": email, "password": password})
    assert reg_res.status_code == 200, reg_res.text
    user_data = reg_res.json()
    assert user_data["email"] == email

    # 2. Login to obtain JWT Token
    login_res = client.post(
        "/api/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert login_res.status_code == 200, login_res.text
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # 3. Verify /me endpoint
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

    # 4. Upload Resume
    file_bytes = io.BytesIO(SAMPLE_RESUME_TEXT.encode("utf-8"))
    upload_res = client.post(
        "/api/resumes/",
        files={"file": ("alex_morgan_resume.txt", file_bytes, "text/plain")},
        data={"title": "Alex Morgan - Senior Engineer"},
        headers=auth_headers
    )
    assert upload_res.status_code == 200, upload_res.text
    resume = upload_res.json()
    assert "id" in resume
    assert "resume_id" in resume
    assert resume["id"] == resume["resume_id"]
    resume_id = resume["id"]

    # 5. Get List of Resumes
    resumes_list_res = client.get("/api/resumes/", headers=auth_headers)
    assert resumes_list_res.status_code == 200
    resumes_list = resumes_list_res.json()
    assert len(resumes_list) >= 1
    assert any(r["id"] == resume_id for r in resumes_list)

    # 6. Get Resume Analysis (structured)
    analysis_res = client.get(f"/api/resumes/{resume_id}/analysis", headers=auth_headers)
    assert analysis_res.status_code == 200, analysis_res.text
    analysis_data = analysis_res.json()
    assert "skills" in analysis_data
    assert "Python" in analysis_data["skills"]
    assert "FastAPI" in analysis_data["skills"]
    assert len(analysis_data["experience"]) > 0

    # 7. Get Resume Report (ATS Breakdown)
    report_res = client.get(f"/api/resumes/{resume_id}/report", headers=auth_headers)
    assert report_res.status_code == 200, report_res.text
    report_data = report_res.json()
    assert "version_id" in report_data
    assert "analysis" in report_data
    ats_analysis = report_data["analysis"]
    assert ats_analysis["overall_score"] > 50
    assert ats_analysis["ats_score"] > 50
    assert len(ats_analysis["strengths"]) > 0
    assert "skills" in ats_analysis["component_scores"]

    # 8. Create Job Posting
    job_res = client.post(
        "/api/jobs/",
        json={
            "title": "Senior Python Developer",
            "company": "Horizon AI Labs",
            "description": SAMPLE_JOB_DESCRIPTION
        },
        headers=auth_headers
    )
    assert job_res.status_code == 200, job_res.text
    job_data = job_res.json()
    assert "id" in job_data
    job_id = job_data["id"]

    # 9. Perform Job-Resume Match
    match_res = client.post(
        f"/api/jobs/{job_id}/match/{resume_id}",
        headers=auth_headers
    )
    assert match_res.status_code == 200, match_res.text
    match_data = match_res.json()
    assert "match_score" in match_data
    assert match_data["match_score"] > 0
    assert "Python" in match_data["matched_skills"]
    assert len(match_data["recommendations"]) > 0

    # 10. Query Matches List
    matches_list_res = client.get("/api/matches/", headers=auth_headers)
    assert matches_list_res.status_code == 200, matches_list_res.text
    matches_list = matches_list_res.json()
    assert len(matches_list) >= 1

    # 11. Test AI Writing Tools
    # 11a. Section Rewrite
    rewrite_res = client.post(
        "/api/writing/rewrite",
        json={"section_text": "worked on building web services using python and fast api", "style": "Executive"},
        headers=auth_headers
    )
    assert rewrite_res.status_code == 200
    assert "rewritten_text" in rewrite_res.json()
    assert len(rewrite_res.json()["rewritten_text"]) > 20

    # 11b. Summary Generator
    summary_res = client.post(
        f"/api/writing/{resume_id}/summary",
        json={"style": "Professional"},
        headers=auth_headers
    )
    assert summary_res.status_code == 200
    assert "summary" in summary_res.json()
    assert len(summary_res.json()["summary"]) > 50

    # 11c. Cover Letter Generator
    cover_letter_res = client.post(
        f"/api/writing/{resume_id}/cover-letter",
        json={"job_id": job_id, "company_name": "Horizon AI Labs"},
        headers=auth_headers
    )
    assert cover_letter_res.status_code == 200
    assert "cover_letter" in cover_letter_res.json()
    assert "Horizon AI Labs" in cover_letter_res.json()["cover_letter"]

    # 12. Test History Endpoints for Dashboard
    dash_analyses = client.get("/api/history/analyses", headers=auth_headers)
    assert dash_analyses.status_code == 200
    assert len(dash_analyses.json()) >= 1
    assert "overall_score" in dash_analyses.json()[0]

    dash_matches = client.get("/api/history/job-matches", headers=auth_headers)
    assert dash_matches.status_code == 200
    assert len(dash_matches.json()) >= 1
    assert "match_score" in dash_matches.json()[0]
