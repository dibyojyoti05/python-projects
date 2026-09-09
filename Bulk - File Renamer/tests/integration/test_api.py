import pytest
import tempfile
import shutil
from pathlib import Path
from fastapi.testclient import TestClient
from services.api.app import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_get_rules():
    response = client.get("/api/rules")
    assert response.status_code == 200
    rules = response.json()
    assert len(rules) >= 5
    rule_names = [r["name"] for r in rules]
    assert "Add Prefix" in rule_names
    assert "Replace Text" in rule_names

def test_preview_api():
    payload = {
        "files": ["report.pdf", "image.png"],
        "rules": [
            {"name": "Add Prefix", "config": {"prefix": "2026_"}}
        ]
    }
    response = client.post("/api/preview", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert data["valid_count"] == 2
    assert data["items"][0]["new_name"] == "2026_report.pdf"
    assert data["items"][1]["new_name"] == "2026_image.png"

def test_execute_and_undo_api():
    temp_dir = Path(tempfile.mkdtemp())
    try:
        f1 = temp_dir / "item_a.txt"
        f2 = temp_dir / "item_b.txt"
        f1.write_text("a")
        f2.write_text("b")

        payload = {
            "files": [str(f1), str(f2)],
            "rules": [
                {"name": "Add Prefix", "config": {"prefix": "PROCESSED_"}}
            ],
            "description": "API Test Execution"
        }
        res = client.post("/api/execute", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["renamed_count"] == 2
        txn_id = data["transaction_id"]
        assert txn_id is not None

        new_f1 = temp_dir / "PROCESSED_item_a.txt"
        assert new_f1.exists()

        # Test Undo via API
        undo_res = client.post(f"/api/history/{txn_id}/undo")
        assert undo_res.status_code == 200
        assert f1.exists()
    finally:
        shutil.rmtree(temp_dir)

def test_ai_suggest_api():
    payload = {
        "files": ["my cool picture.jpg", "old draft.doc"],
        "prompt": "kebab-case and lower"
    }
    res = client.post("/api/ai/suggest", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "my cool picture.jpg" in data["suggestions"]
    assert data["suggestions"]["my cool picture.jpg"] == "my-cool-picture.jpg"
