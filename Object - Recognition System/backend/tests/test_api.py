import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_system_health():
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"]["status"] == "healthy"

def test_auth_login_success():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@example.com"

def test_auth_login_invalid():
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "wrongpassword"}
    )
    assert response.status_code == 400

def test_auth_me():
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    token = login_res.json()["access_token"]
    
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "admin@example.com"

def test_cameras_crud():
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List cameras
    res = client.get("/api/v1/cameras/", headers=headers)
    assert res.status_code == 200
    cams = res.json()
    assert len(cams) >= 1

    # 2. Create camera
    new_cam = {
        "name": "Test Lab Camera",
        "location": "Research Wing 3",
        "rtsp_url": "rtsp://10.0.0.99/live",
        "ai_enabled": True
    }
    create_res = client.post("/api/v1/cameras/", json=new_cam, headers=headers)
    assert create_res.status_code == 200
    cam_id = create_res.json()["id"]

    # 3. Read single
    get_res = client.get(f"/api/v1/cameras/{cam_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Test Lab Camera"

    # 4. Update
    update_data = {"name": "Updated Test Camera", "location": "Research Wing 4"}
    put_res = client.put(f"/api/v1/cameras/{cam_id}", json=update_data, headers=headers)
    assert put_res.status_code == 200
    assert put_res.json()["name"] == "Updated Test Camera"

    # 5. Toggle AI
    toggle_res = client.post(f"/api/v1/cameras/{cam_id}/toggle-ai", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["ai_enabled"] is False

    # 6. Delete
    del_res = client.delete(f"/api/v1/cameras/{cam_id}", headers=headers)
    assert del_res.status_code == 200

def test_events_api_and_stats():
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List events
    res = client.get("/api/v1/events/", headers=headers)
    assert res.status_code == 200
    events = res.json()
    assert len(events) >= 1

    # 2. Summary stats
    summary_res = client.get("/api/v1/events/stats/summary", headers=headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["total_detections"] > 0
    assert summary["total_cameras"] > 0

    # 3. Hourly stats
    hourly_res = client.get("/api/v1/events/stats/hourly", headers=headers)
    assert hourly_res.status_code == 200
    hourly = hourly_res.json()
    assert isinstance(hourly, list)
    assert len(hourly) > 0

    # 4. Classes stats
    classes_res = client.get("/api/v1/events/stats/classes", headers=headers)
    assert classes_res.status_code == 200
    classes = classes_res.json()
    assert isinstance(classes, list)
    assert len(classes) > 0

def test_streams_endpoints():
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@example.com", "password": "admin123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Start stream for camera 1
    start_res = client.post("/api/v1/streams/1/start", headers=headers)
    assert start_res.status_code == 200

    # Check active
    active_res = client.get("/api/v1/streams/active", headers=headers)
    assert active_res.status_code == 200
    assert 1 in active_res.json()["active_camera_ids"]

    # Stop stream
    stop_res = client.post("/api/v1/streams/1/stop", headers=headers)
    assert stop_res.status_code == 200
