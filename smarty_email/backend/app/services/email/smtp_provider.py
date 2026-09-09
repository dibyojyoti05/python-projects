import smtplib
from email.message import EmailMessage
import logging
from typing import List, Optional, Dict
from datetime import datetime

from app.services.email.base import EmailProvider, EmailMessageData

logger = logging.getLogger(__name__)

class SMTPEmailProvider(EmailProvider):
    def __init__(self, host: str, user: str, password: str, port: int = 587):
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.server = None

    def connect(self) -> None:
        self.server = smtplib.SMTP(self.host, self.port)
        self.server.starttls()
        self.server.login(self.user, self.password)
        logger.info(f"Connected to SMTP server {self.host} as {self.user}")

    def disconnect(self) -> None:
        if self.server:
            self.server.quit()
            self.server = None
            logger.info(f"Disconnected from SMTP server {self.host}")

    def send_message(self, to: List[str], subject: str, body_text: str, body_html: Optional[str] = None, cc: List[str] = [], bcc: List[str] = [], attachments: List[Dict] = []) -> bool:
        if not self.server:
            raise Exception("Not connected to SMTP server")
            
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['From'] = self.user
        msg['To'] = ", ".join(to)
        if cc:
            msg['Cc'] = ", ".join(cc)
        if bcc:
            msg['Bcc'] = ", ".join(bcc)
            
        msg.set_content(body_text)
        
        if body_html:
            msg.add_alternative(body_html, subtype='html')
            
        for att in attachments:
            maintype, subtype = att.get('content_type', 'application/octet-stream').split('/', 1)
            msg.add_attachment(att['data'], maintype=maintype, subtype=subtype, filename=att['filename'])
            
        all_recipients = to + cc + bcc
        self.server.send_message(msg, self.user, all_recipients)
        return True

    def fetch_messages(self, folder: str = "INBOX", limit: int = 50, since: Optional[datetime] = None) -> List[EmailMessageData]:
        raise NotImplementedError("SMTP provider does not fetch messages. Use IMAPEmailProvider.")

    def fetch_message(self, message_id: str, folder: str = "INBOX") -> Optional[EmailMessageData]:
        raise NotImplementedError("SMTP provider does not fetch messages.")

    def mark_read(self, message_id: str, folder: str = "INBOX") -> bool:
        raise NotImplementedError("SMTP provider does not mark messages.")

    def mark_unread(self, message_id: str, folder: str = "INBOX") -> bool:
        raise NotImplementedError("SMTP provider does not mark messages.")

    def move_message(self, message_id: str, source_folder: str, dest_folder: str) -> bool:
        raise NotImplementedError("SMTP provider does not move messages.")
