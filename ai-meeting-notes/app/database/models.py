import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey, Enum, Float, JSON
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class PriorityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ActionItemStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class MeetingStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False, default="Untitled Meeting")
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    duration_minutes = Column(Float, nullable=True)
    source_filename = Column(String(255), nullable=True)
    file_type = Column(String(50), nullable=True)  # text, audio, video
    file_hash = Column(String(64), nullable=True, index=True)
    file_size_bytes = Column(Integer, nullable=True)
    status = Column(Enum(MeetingStatus), default=MeetingStatus.PENDING, nullable=False)
    processing_time_seconds = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    transcript = relationship("Transcript", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    participants = relationship("Participant", back_populates="meeting", cascade="all, delete-orphan")
    logs = relationship("ProcessingLog", back_populates="meeting", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "date": self.date.isoformat() if self.date else None,
            "duration_minutes": self.duration_minutes,
            "source_filename": self.source_filename,
            "file_type": self.file_type,
            "file_hash": self.file_hash,
            "status": self.status.value if self.status else "PENDING",
            "processing_time_seconds": self.processing_time_seconds,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    raw_text = Column(Text, nullable=False)
    cleaned_text = Column(Text, nullable=True)
    word_count = Column(Integer, default=0)
    has_speaker_labels = Column(Integer, default=0)  # Boolean 0 or 1 for SQLite compatibility
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="transcript")


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    quick_summary = Column(Text, nullable=False)
    standard_summary = Column(Text, nullable=True)
    detailed_summary = Column(Text, nullable=True)
    key_points = Column(JSON, default=list)  # List[str]
    decisions = Column(JSON, default=list)   # List[str]
    questions = Column(JSON, default=list)   # List[str]
    topics = Column(JSON, default=list)      # List[str]
    model_used = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="summary")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    task = Column(Text, nullable=False)
    assignee = Column(String(150), default="Not specified")
    deadline = Column(String(150), default="Not specified")
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, nullable=False)
    status = Column(Enum(ActionItemStatus), default=ActionItemStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="action_items")

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "task": self.task,
            "assignee": self.assignee,
            "deadline": self.deadline,
            "priority": self.priority.value if self.priority else "MEDIUM",
            "status": self.status.value if self.status else "PENDING",
        }


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    role = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)

    meeting = relationship("Meeting", back_populates="participants")


class ProcessingLog(Base):
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True)
    step_name = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)  # "SUCCESS", "INFO", "WARNING", "ERROR"
    duration_ms = Column(Integer, nullable=True)
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meeting = relationship("Meeting", back_populates="logs")


class ApplicationSetting(Base):
    __tablename__ = "application_settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

