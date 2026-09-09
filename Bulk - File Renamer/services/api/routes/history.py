from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from services.history_service.service import HistoryService
from services.api.schemas import TransactionItemResponse

router = APIRouter(prefix="/api/history", tags=["Transaction History"])
history_service = HistoryService()

@router.get("", response_model=List[TransactionItemResponse])
def get_transactions(limit: int = 50, offset: int = 0, include_undone: bool = True):
    """Retrieves list of rename transactions."""
    return history_service.list_transactions(limit=limit, offset=offset, include_undone=include_undone)

@router.get("/stats")
def get_history_stats():
    """Retrieves aggregate transaction statistics."""
    return history_service.get_stats()

@router.get("/{transaction_id}")
def get_transaction_detail(transaction_id: int):
    """Retrieves details of a single transaction including operations."""
    txn = history_service.get_transaction(transaction_id)
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction #{transaction_id} not found")
    return txn

@router.post("/{transaction_id}/undo")
def undo_transaction(transaction_id: int):
    """Rollbacks a transaction by reversing file operations."""
    success = history_service.undo_transaction(transaction_id)
    if not success:
        raise HTTPException(
            status_code=400, 
            detail=f"Failed to undo transaction #{transaction_id}. It may already be undone or target files were modified."
        )
    return {"success": True, "message": f"Successfully rolled back transaction #{transaction_id}"}
