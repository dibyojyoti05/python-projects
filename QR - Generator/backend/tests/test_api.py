import pytest
import io
import zipfile
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/")
    assert response.status_code == 200
    assert "Welcome to Enterprise QR Platform" in response.json()["message"]

@pytest.mark.asyncio
async def test_admin_login_and_auth_me():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        login_res = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "admin123"}
        )
        assert login_res.status_code == 200
        token_data = login_res.json()
        assert "access_token" in token_data
        token = token_data["access_token"]
        
        # Test /auth/me
        me_res = await ac.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_res.status_code == 200
        user_info = me_res.json()
        assert user_info["email"] == "admin@example.com"

@pytest.mark.asyncio
async def test_qr_generation_redirect_and_analytics():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Login
        login_res = await ac.post(
            "/api/v1/auth/login",
            data={"username": "admin@example.com", "password": "admin123"}
        )
        token = login_res.json()["access_token"]
        auth_header = {"Authorization": f"Bearer {token}"}
        
        # 2. Create Dynamic QR Code
        qr_payload = {
            "name": "Integration Test QR",
            "is_dynamic": True,
            "qr_type": "URL",
            "destination_url": "https://example.com/target-page",
            "customization": {
                "color": "#4f46e5",
                "bg_color": "#ffffff",
                "scale": 10
            }
        }
        create_res = await ac.post("/api/v1/qr/", json=qr_payload, headers=auth_header)
        assert create_res.status_code == 200
        qr = create_res.json()
        qr_id = qr["id"]
        short_code = qr["short_code"]
        assert short_code is not None
        
        # 3. Test QR Image Serving
        img_res = await ac.get(f"/api/v1/qr/{qr_id}/image?format=svg")
        assert img_res.status_code == 200
        assert "svg" in img_res.headers["content-type"]
        assert b"<svg" in img_res.content
        
        # 4. Test Dynamic Redirection (Logs a scan)
        redir_res = await ac.get(
            f"/r/{short_code}",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0"}
        )
        assert redir_res.status_code == 307
        assert redir_res.headers["location"] == "https://example.com/target-page"
        
        # 5. Verify Analytics
        analytics_res = await ac.get(f"/api/v1/qr/{qr_id}/analytics", headers=auth_header)
        assert analytics_res.status_code == 200
        analytics = analytics_res.json()
        assert analytics["total_scans"] >= 1
        assert "Chrome" in analytics["browsers"]
        assert "Windows" in analytics["operating_systems"]
        
        # 6. Test Update QR Code Destination
        update_res = await ac.put(
            f"/api/v1/qr/{qr_id}",
            json={"destination_url": "https://example.com/updated-target"},
            headers=auth_header
        )
        assert update_res.status_code == 200
        assert update_res.json()["destination_url"] == "https://example.com/updated-target"

@pytest.mark.asyncio
async def test_bulk_generation_and_template():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Template download
        tpl_res = await ac.get("/api/v1/bulk/template")
        assert tpl_res.status_code == 200
        assert "name,destination_url" in tpl_res.text
        
        # Generate ZIP from CSV
        sample_csv = "name,destination_url\nWebsite,https://test.com\nPortal,https://portal.test.com\n"
        files = {"file": ("test.csv", sample_csv.encode("utf-8"), "text/csv")}
        bulk_res = await ac.post("/api/v1/bulk/generate?format=png", files=files)
        assert bulk_res.status_code == 200
        assert bulk_res.headers["content-type"] == "application/zip"
        
        # Verify ZIP contains 2 files
        zip_obj = zipfile.ZipFile(io.BytesIO(bulk_res.content))
        file_list = zip_obj.namelist()
        assert len(file_list) == 2
