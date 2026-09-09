import os
from pathlib import Path
from db.database import SessionLocal
from db.models.history import Transaction, RenameOperation
from core.preview_engine.preview import RenamePreviewItem
from typing import List

class UndoManager:
    """
    Manages recording transactions and rolling them back.
    """
    def record_transaction(self, items: List[RenamePreviewItem], description: str = "Batch Rename"):
        db = SessionLocal()
        try:
            transaction = Transaction(description=description)
            db.add(transaction)
            db.commit()
            db.refresh(transaction)
            
            for item in items:
                if item.is_valid and not item.error_message:
                    op = RenameOperation(
                        transaction_id=transaction.id,
                        original_path=str(item.original_path),
                        new_path=str(item.new_path),
                        status="SUCCESS"
                    )
                    db.add(op)
            db.commit()
        finally:
            db.close()
            
    def undo_transaction(self, transaction_id: int) -> bool:
        db = SessionLocal()
        try:
            transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
            if not transaction or transaction.is_undone:
                return False
                
            for op in reversed(transaction.operations):
                current_path = Path(op.new_path)
                original_path = Path(op.original_path)
                if current_path.exists():
                    os.rename(current_path, original_path)
                    
            transaction.is_undone = True
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            return False
        finally:
            db.close()
