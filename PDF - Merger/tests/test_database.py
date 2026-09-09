import os
import pytest
from db.database import init_db, SessionLocal
from db.models import OperationHistory, RecentDocument, AppSetting
from services.history_service import HistoryService
from services.settings_service import SettingsService

@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield

def test_database_init_and_tables():
    session = SessionLocal()
    try:
        # Check that we can query models without error
        hist_count = session.query(OperationHistory).count()
        assert hist_count >= 0
        recent_count = session.query(RecentDocument).count()
        assert recent_count >= 0
        setting_count = session.query(AppSetting).count()
        assert setting_count >= 0
    finally:
        session.close()

def test_history_service_logging_and_filtering(tmp_path):
    test_in = str(tmp_path / "in.pdf")
    test_out = str(tmp_path / "out.pdf")
    with open(test_in, "w") as f:
        f.write("test data")
    with open(test_out, "w") as f:
        f.write("test data 2")

    # Log an operation
    entry = HistoryService.log_operation(
        operation_type="TEST_OP",
        input_files=[test_in],
        output_file=test_out,
        status="SUCCESS",
        duration_ms=42
    )
    assert entry is not None
    assert entry.id is not None
    assert entry.operation_type == "TEST_OP"
    assert entry.status == "SUCCESS"
    assert entry.duration_ms == 42

    # Query history
    history = HistoryService.get_history(limit=50, op_type="TEST_OP")
    assert len(history) >= 1
    matched = [h for h in history if h["id"] == entry.id]
    assert len(matched) == 1
    assert matched[0]["operation_type"] == "TEST_OP"

def test_history_service_recent_documents(tmp_path):
    fake_doc = str(tmp_path / "sample_manual.pdf")
    with open(fake_doc, "w") as f:
        f.write("content")

    HistoryService.record_recent_document(fake_doc, page_count=10, current_page=3)
    recent = HistoryService.get_recent_documents(limit=5)
    matched = [d for d in recent if d["file_path"] == fake_doc]
    assert len(matched) == 1
    assert matched[0]["page_count"] == 10
    assert matched[0]["last_page_viewed"] == 3

    # Update page
    HistoryService.record_recent_document(fake_doc, page_count=10, current_page=7)
    recent2 = HistoryService.get_recent_documents(limit=5)
    matched2 = [d for d in recent2 if d["file_path"] == fake_doc]
    assert matched2[0]["last_page_viewed"] == 7

def test_settings_service_key_value():
    SettingsService.set_setting("CUSTOM_TEST_KEY", "AntigravityValue123")
    val = SettingsService.get_setting("CUSTOM_TEST_KEY")
    assert val == "AntigravityValue123"

    all_settings = SettingsService.get_all_settings()
    assert all_settings.get("CUSTOM_TEST_KEY") == "AntigravityValue123"
