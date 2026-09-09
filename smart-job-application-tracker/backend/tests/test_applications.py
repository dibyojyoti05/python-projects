from app.models.job import Job
from app.models.application import ApplicationStatusHistory

def test_create_and_manage_application(client, db_session, auth_headers):
    job = Job(
        title="Senior AI Engineer",
        company="OpenTech",
        location="Remote",
        source_url="https://example.com/ai-eng"
    )
    db_session.add(job)
    db_session.commit()

    # Create application
    app_data = {
        "job_id": job.id,
        "status": "Saved",
        "notes": "Referred by friend"
    }
    create_res = client.post("/api/applications/", json=app_data, headers=auth_headers)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["status"] == "Saved"
    app_id = created["id"]

    # List applications
    list_res = client.get("/api/applications/", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Update status to Applied
    update_res = client.patch(
        f"/api/applications/{app_id}",
        json={"status": "Applied", "notes": "Submitted application form"},
        headers=auth_headers
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["status"] == "Applied"
    assert updated["applied_at"] is not None

    # Check status history was created
    history_count = db_session.query(ApplicationStatusHistory).filter(
        ApplicationStatusHistory.application_id == app_id
    ).count()
    assert history_count >= 2

    # Delete application
    del_res = client.delete(f"/api/applications/{app_id}", headers=auth_headers)
    assert del_res.status_code == 204
