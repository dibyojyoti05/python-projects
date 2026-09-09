from datetime import datetime
from app.models.job import Job
from app.models.application import Application

def test_interviews_and_followups_lifecycle(client, db_session, test_user, auth_headers):
    # Setup job and application
    job = Job(
        title="Full Stack Engineer",
        company="StartupCo",
        source_url="https://startup.co/job"
    )
    db_session.add(job)
    db_session.commit()

    application = Application(
        user_id=test_user.id,
        job_id=job.id,
        status="Interview"
    )
    db_session.add(application)
    db_session.commit()

    # 1. Create Interview
    interview_payload = {
        "application_id": application.id,
        "stage": "Technical Architecture",
        "interview_date": datetime.utcnow().isoformat(),
        "notes": "Prepare system design diagrams"
    }
    create_int_res = client.post("/api/interviews/", json=interview_payload, headers=auth_headers)
    assert create_int_res.status_code == 200
    int_data = create_int_res.json()
    assert int_data["stage"] == "Technical Architecture"
    assert int_data["application_id"] == application.id
    interview_id = int_data["id"]


    # 2. List Interviews
    list_int_res = client.get("/api/interviews/", headers=auth_headers)
    assert list_int_res.status_code == 200
    assert len(list_int_res.json()) >= 1

    # 3. Update Interview
    patch_int_res = client.patch(
        f"/api/interviews/{interview_id}",
        json={"notes": "Passed round 1, scheduled round 2"},
        headers=auth_headers
    )
    assert patch_int_res.status_code == 200
    assert patch_int_res.json()["notes"] == "Passed round 1, scheduled round 2"

    # 4. Create FollowUp
    followup_payload = {
        "application_id": application.id,
        "due_date": datetime.utcnow().isoformat(),
        "notes": "Send thank you note"
    }
    create_flw_res = client.post("/api/followups/", json=followup_payload, headers=auth_headers)
    assert create_flw_res.status_code == 200
    flw_data = create_flw_res.json()
    assert flw_data["notes"] == "Send thank you note"
    followup_id = flw_data["id"]

    # 5. List FollowUps
    list_flw_res = client.get("/api/followups/", headers=auth_headers)
    assert list_flw_res.status_code == 200
    assert len(list_flw_res.json()) >= 1

    # 6. Update FollowUp status
    patch_flw_res = client.patch(
        f"/api/followups/{followup_id}",
        json={"is_completed": True},
        headers=auth_headers
    )
    assert patch_flw_res.status_code == 200
    assert patch_flw_res.json()["is_completed"] is True
