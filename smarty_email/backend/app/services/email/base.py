from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class EmailAttachment(BaseModel):
    filename: str
    content_type: str
    size: int
    data: bytes

class EmailMessageData(BaseModel):
    message_id: str
    thread_id: Optional[str] = None
    sender: str
    recipients: List[str]
    cc: List[str] = []
    bcc: List[str] = []
    subject: str
    body_text: str
    body_html: str
    date: datetime
    attachments: List[EmailAttachment] = []

class EmailProvider(ABC):
    
    @abstractmethod
    def connect(self) -> None:
        pass

    @abstractmethod
    def disconnect(self) -> None:
        pass

    @abstractmethod
    def fetch_messages(self, folder: str = "INBOX", limit: int = 50, since: Optional[datetime] = None) -> List[EmailMessageData]:
        pass

    @abstractmethod
    def fetch_message(self, message_id: str, folder: str = "INBOX") -> Optional[EmailMessageData]:
        pass

    @abstractmethod
    def mark_read(self, message_id: str, folder: str = "INBOX") -> bool:
        pass

    @abstractmethod
    def mark_unread(self, message_id: str, folder: str = "INBOX") -> bool:
        pass

    @abstractmethod
    def move_message(self, message_id: str, source_folder: str, dest_folder: str) -> bool:
        pass

    @abstractmethod
    def send_message(self, to: List[str], subject: str, body_text: str, body_html: Optional[str] = None, cc: List[str] = [], bcc: List[str] = [], attachments: List[Dict] = []) -> bool:
        pass
