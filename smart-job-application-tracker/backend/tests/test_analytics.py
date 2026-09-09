from app.models.job import Job
from app.models.application import Application

def test_analytics_metrics(client, db_session, test_user, auth_headers):
    job1 = Job(title="Dev 1", company="Co 1", source_url="https://ex.com/1")
    job2 = Job(title="Dev 2", company="Co 2", source_url="https://ex.com/2")
    job3 = Job(title="Dev 3", company="Co 3", source_url="https://ex.com/3")
    db_session.add_all([job1, job2, job3])
    db_session.commit()

    app1 = Application(user_id=test_user.id, job_id=job1.id, status="Applied")
    app2 = Application(user_id=test_user.id, job_id=job2.id, status="Offer")
    app3 = Application(user_id=test_user.id, job_id=job3.id, status="Rejected")
    db_session.add_all([app1, app2, app3])
    db_session.commit()

    res = client.get("/api/analytics/", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_applications"] == 3
    assert data["total_offers"] == 1
    assert data["total_rejected"] == 1
    assert "Applied" in data["applications_by_status"]
