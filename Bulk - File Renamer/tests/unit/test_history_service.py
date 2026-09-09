import pytest
import tempfile
import shutil
from pathlib import Path
from db.database import init_db, SessionLocal
from db.models.history import Transaction, RenameOperation
from services.history_service.service import HistoryService
from core.undo_engine.manager import UndoManager
from core.preview_engine.preview import RenamePreviewItem

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

def test_history_service_list_and_stats():
    service = HistoryService()
    initial_stats = service.get_stats()
    assert "total_transactions" in initial_stats
    assert "active_transactions" in initial_stats

    # Create dummy files and a real transaction
    temp_dir = Path(tempfile.mkdtemp())
    try:
        f1 = temp_dir / "old_doc.txt"
        f1.write_text("content")

        undo_mgr = UndoManager()
        item = RenamePreviewItem(
            original_path=f1,
            new_name="new_doc.txt",
            is_valid=True
        )
        # rename file
        f1.rename(item.new_path)

        undo_mgr.record_transaction([item], description="Test Txn")

        txns = service.list_transactions(limit=10)
        assert len(txns) > 0
        latest = txns[0]
        assert latest["description"] == "Test Txn"

        details = service.get_transaction(latest["id"])
        assert details is not None
        assert len(details["operations"]) == 1

        # Test undo through service
        success = service.undo_transaction(latest["id"])
        assert success is True
        assert f1.exists()
    finally:
        shutil.rmtree(temp_dir)
