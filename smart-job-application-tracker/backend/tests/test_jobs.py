from app.models.job import Job, JobSource

def test_get_jobs_empty(client):
    response = client.get("/api/jobs/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_jobs_with_filters(client, db_session):
    source = JobSource(name="TestBoard", is_active=True)
    db_session.add(source)
    db_session.commit()

    job1 = Job(
        title="Python Backend Engineer",
        company="TechCorp",
        location="Berlin",
        remote_type="Remote",
        source_id=source.id,
        source_url="https://example.com/job1"
    )
    job2 = Job(
        title="React Frontend Developer",
        company="DesignStudio",
        location="London",
        remote_type="On-site",
        source_id=source.id,
        source_url="https://example.com/job2"
    )
    db_session.add_all([job1, job2])
    db_session.commit()

    # Search keyword
    res = client.get("/api/jobs/?keyword=Python")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["title"] == "Python Backend Engineer"

    # Search location
    res_loc = client.get("/api/jobs/?location=London")
    assert res_loc.status_code == 200
    assert len(res_loc.json()) == 1
    assert res_loc.json()[0]["company"] == "DesignStudio"

    # Search remote_type
    res_remote = client.get("/api/jobs/?remote_type=Remote")
    assert res_remote.status_code == 200
    assert len(res_remote.json()) == 1

def test_save_and_unsave_job(client, db_session, auth_headers):
    job = Job(
        title="Full Stack Developer",
        company="InnovateInc",
        location="Remote",
        source_url="https://example.com/job-fs"
    )
    db_session.add(job)
    db_session.commit()

    # Save job
    save_res = client.post(f"/api/jobs/{job.id}/save", headers=auth_headers)
    assert save_res.status_code == 200
    assert save_res.json()["job_id"] == job.id

    # Duplicate save should fail
    dup_res = client.post(f"/api/jobs/{job.id}/save", headers=auth_headers)
    assert dup_res.status_code == 400

    # Unsave job
    unsave_res = client.delete(f"/api/jobs/{job.id}/save", headers=auth_headers)
    assert unsave_res.status_code == 204
