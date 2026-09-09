import json
from pathlib import Path
from typing import List, Optional, Dict, Any
from db.database import SessionLocal
from db.models.history import Transaction, RenameOperation
from core.undo_engine.manager import UndoManager

class HistoryService:
    """Service layer for querying, managing, and undoing batch rename transactions."""
    def __init__(self):
        self.undo_manager = UndoManager()

    def list_transactions(
        self, 
        limit: int = 50, 
        offset: int = 0, 
        include_undone: bool = True
    ) -> List[Dict[str, Any]]:
        """Retrieves transactions with their operation counts."""
        db = SessionLocal()
        try:
            query = db.query(Transaction)
            if not include_undone:
                query = query.filter(Transaction.is_undone == False)
            txns = query.order_by(Transaction.id.desc()).offset(offset).limit(limit).all()
            
            result = []
            for t in txns:
                result.append({
                    "id": t.id,
                    "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                    "description": t.description,
                    "is_undone": t.is_undone,
                    "operations_count": len(t.operations)
                })
            return result
        finally:
            db.close()

    def get_transaction(self, transaction_id: int) -> Optional[Dict[str, Any]]:
        """Retrieves full details of a specific transaction including all operations."""
        db = SessionLocal()
        try:
            t = db.query(Transaction).filter(Transaction.id == transaction_id).first()
            if not t:
                return None
            return {
                "id": t.id,
                "timestamp": t.timestamp.isoformat() if t.timestamp else None,
                "description": t.description,
                "is_undone": t.is_undone,
                "operations": [
                    {
                        "id": op.id,
                        "original_path": op.original_path,
                        "new_path": op.new_path,
                        "status": op.status
                    } for op in t.operations
                ]
            }
        finally:
            db.close()

    def undo_transaction(self, transaction_id: int) -> bool:
        """Rollbacks a transaction by its ID."""
        return self.undo_manager.undo_transaction(transaction_id)

    def undo_last_transaction(self) -> bool:
        """Rollbacks the most recent active transaction."""
        db = SessionLocal()
        try:
            last_txn = db.query(Transaction).filter(Transaction.is_undone == False).order_by(Transaction.id.desc()).first()
            if not last_txn:
                return False
            txn_id = last_txn.id
        finally:
            db.close()
        return self.undo_manager.undo_transaction(txn_id)

    def get_stats(self) -> Dict[str, Any]:
        """Returns aggregate statistics for rename history."""
        db = SessionLocal()
        try:
            total_txns = db.query(Transaction).count()
            undone_txns = db.query(Transaction).filter(Transaction.is_undone == True).count()
            total_ops = db.query(RenameOperation).count()
            return {
                "total_transactions": total_txns,
                "active_transactions": total_txns - undone_txns,
                "undone_transactions": undone_txns,
                "total_operations": total_ops
            }
        finally:
            db.close()
