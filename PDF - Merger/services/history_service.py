import os
import json
import logging
from typing import List, Optional, Dict, Any
from db.database import SessionLocal
from db.models import OperationHistory, RecentDocument

logger = logging.getLogger(__name__)

class HistoryService:
    """Thread-safe service to record and query operation and document history."""

    @staticmethod
    def log_operation(
        operation_type: str,
        input_files: List[str] | str,
        output_file: Optional[str] = None,
        status: str = "SUCCESS",
        error_message: Optional[str] = None,
        duration_ms: int = 0
    ) -> Optional[OperationHistory]:
        """Record a PDF operation to the database."""
        session = SessionLocal()
        try:
            if isinstance(input_files, list):
                # Calculate initial size
                size_before = 0
                for f in input_files:
                    if os.path.exists(f):
                        size_before += os.path.getsize(f)
                input_str = json.dumps(input_files)
            else:
                size_before = os.path.getsize(input_files) if os.path.exists(input_files) else 0
                input_str = json.dumps([input_files])

            size_after = 0
            if output_file and os.path.exists(output_file):
                if os.path.isfile(output_file):
                    size_after = os.path.getsize(output_file)
                elif os.path.isdir(output_file):
                    size_after = sum(
                        os.path.getsize(os.path.join(output_file, f))
                        for f in os.listdir(output_file)
                        if os.path.isfile(os.path.join(output_file, f))
                    )

            entry = OperationHistory(
                operation_type=operation_type,
                input_files=input_str,
                output_file=output_file or "",
                file_size_before=size_before,
                file_size_after=size_after,
                status=status,
                error_message=error_message,
                duration_ms=duration_ms
            )
            session.add(entry)
            session.commit()
            session.refresh(entry)
            logger.info(f"Logged operation: {operation_type} -> {status}")
            return entry
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to log operation: {e}")
            return None
        finally:
            session.close()

    @staticmethod
    def get_history(limit: int = 100, op_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve recent operation history entries."""
        session = SessionLocal()
        try:
            query = session.query(OperationHistory).order_by(OperationHistory.created_at.desc())
            if op_type and op_type != "ALL":
                query = query.filter(OperationHistory.operation_type == op_type)
            records = query.limit(limit).all()
            return [r.to_dict() for r in records]
        except Exception as e:
            logger.error(f"Failed to fetch history: {e}")
            return []
        finally:
            session.close()

    @staticmethod
    def clear_history() -> bool:
        """Clear all operation history."""
        session = SessionLocal()
        try:
            session.query(OperationHistory).delete()
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to clear history: {e}")
            return False
        finally:
            session.close()

    @staticmethod
    def record_recent_document(file_path: str, page_count: int, current_page: int = 1):
        """Record or update a recently opened document in the viewer."""
        if not os.path.exists(file_path):
            return
        session = SessionLocal()
        try:
            doc = session.query(RecentDocument).filter_by(file_path=file_path).first()
            if doc:
                doc.last_page_viewed = current_page
                doc.page_count = page_count
            else:
                doc = RecentDocument(
                    file_path=file_path,
                    file_name=os.path.basename(file_path),
                    page_count=page_count,
                    last_page_viewed=current_page
                )
                session.add(doc)
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Failed to record recent document: {e}")
        finally:
            session.close()

    @staticmethod
    def get_recent_documents(limit: int = 10) -> List[Dict[str, Any]]:
        """Retrieve recent documents opened in viewer."""
        session = SessionLocal()
        try:
            docs = session.query(RecentDocument).order_by(RecentDocument.last_opened_at.desc()).limit(limit).all()
            return [d.to_dict() for d in docs]
        except Exception as e:
            logger.error(f"Failed to fetch recent docs: {e}")
            return []
        finally:
            session.close()
