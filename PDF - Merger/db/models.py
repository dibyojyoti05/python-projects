import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, BigInteger
from db.database import Base

class OperationHistory(Base):
    """Stores audit log for all PDF operations."""
    __tablename__ = "operation_history"

    id = Column(Integer, primary_key=True, index=True)
    operation_type = Column(String(50), nullable=False, index=True)  # MERGE, SPLIT, COMPRESS, etc.
    input_files = Column(Text, nullable=False)  # JSON or comma-separated file paths
    output_file = Column(Text, nullable=True)   # Destination file or folder path
    file_size_before = Column(BigInteger, nullable=True, default=0)
    file_size_after = Column(BigInteger, nullable=True, default=0)
    status = Column(String(20), nullable=False, default="SUCCESS")  # SUCCESS, FAILED
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "operation_type": self.operation_type,
            "input_files": self.input_files,
            "output_file": self.output_file,
            "file_size_before": self.file_size_before,
            "file_size_after": self.file_size_after,
            "status": self.status,
            "error_message": self.error_message,
            "duration_ms": self.duration_ms,
            "created_at": self.created_at.strftime("%Y-%m-%d %H:%M:%S") if self.created_at else ""
        }

class RecentDocument(Base):
    """Tracks documents opened in the PDF viewer."""
    __tablename__ = "recent_documents"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(Text, nullable=False, unique=True)
    file_name = Column(String(255), nullable=False)
    page_count = Column(Integer, default=1)
    last_page_viewed = Column(Integer, default=1)
    last_opened_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "file_path": self.file_path,
            "file_name": self.file_name,
            "page_count": self.page_count,
            "last_page_viewed": self.last_page_viewed,
            "last_opened_at": self.last_opened_at.strftime("%Y-%m-%d %H:%M:%S") if self.last_opened_at else ""
        }

class AppSetting(Base):
    """Key-value application settings table."""
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
