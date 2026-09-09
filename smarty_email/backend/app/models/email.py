from sqlalchemy import Column, String, Boolean, ForeignKey, Text, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
import enum

from app.models.base import BaseModel, GUID

class PriorityEnum(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class EmailAccount(BaseModel):
    __tablename__ = "email_accounts"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_address = Column(String(255), nullable=False)
    provider = Column(String(50), nullable=False)  # e.g. "IMAP", "Gmail"
    host = Column(String(255), nullable=True)
    port = Column(String(10), nullable=True)
    encrypted_password = Column(String(512), nullable=True)  # Needs encryption
    is_active = Column(Boolean, default=True)

    user = relationship("User", backref="email_accounts")
    messages = relationship("EmailMessage", backref="account", cascade="all, delete-orphan")

class EmailMessage(BaseModel):
    __tablename__ = "email_messages"

    account_id = Column(GUID(), ForeignKey("email_accounts.id", ondelete="CASCADE"), nullable=False)
    provider_message_id = Column(String(255), nullable=False, index=True)
    thread_id = Column(String(255), nullable=True, index=True)
    sender = Column(String(255), nullable=False)
    recipients = Column(JSON, nullable=False)  # List of emails
    cc = Column(JSON, nullable=True)
    bcc = Column(JSON, nullable=True)
    subject = Column(Text, nullable=False)
    body_text = Column(Text, nullable=True)
    body_html = Column(Text, nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=False)
    is_read = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    folder = Column(String(255), default="INBOX")
    
    analysis = relationship("EmailAnalysis", backref="message", uselist=False, cascade="all, delete-orphan")

class EmailAnalysis(BaseModel):
    __tablename__ = "email_analysis"

    message_id = Column(GUID(), ForeignKey("email_messages.id", ondelete="CASCADE"), nullable=False, unique=True)
    category = Column(String(100), nullable=True)
    priority = Column(Enum(PriorityEnum), nullable=True)
    intent = Column(String(100), nullable=True)
    short_summary = Column(Text, nullable=True)
    key_points = Column(JSON, nullable=True)
    requires_response = Column(Boolean, default=False)
    suggested_response = Column(Text, nullable=True)
    entities = Column(JSON, nullable=True)  # Store extracted entities as JSON
    action_items = Column(JSON, nullable=True)  # Store action items as JSON
    analysis_version = Column(String(50), nullable=True)
