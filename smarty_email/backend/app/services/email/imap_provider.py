import logging
from typing import List, Optional, Dict
from datetime import datetime
from imap_tools import MailBox, AND
from app.services.email.base import EmailProvider, EmailMessageData, EmailAttachment

logger = logging.getLogger(__name__)

class IMAPEmailProvider(EmailProvider):
    def __init__(self, host: str, user: str, password: str, port: int = 993):
        self.host = host
        self.user = user
        self.password = password
        self.port = port
        self.mailbox = None

    def connect(self) -> None:
        self.mailbox = MailBox(self.host, port=self.port).login(self.user, self.password)
        logger.info(f"Connected to IMAP server {self.host} as {self.user}")

    def disconnect(self) -> None:
        if self.mailbox:
            self.mailbox.logout()
            self.mailbox = None
            logger.info(f"Disconnected from IMAP server {self.host}")

    def fetch_messages(self, folder: str = "INBOX", limit: int = 50, since: Optional[datetime] = None) -> List[EmailMessageData]:
        if not self.mailbox:
            raise Exception("Not connected to IMAP server")
        
        self.mailbox.folder.set(folder)
        criteria = AND(date_gte=since.date()) if since else 'ALL'
        
        messages = []
        # imap_tools returns generator
        for msg in self.mailbox.fetch(criteria, limit=limit, reverse=True):
            attachments = []
            for att in msg.attachments:
                attachments.append(EmailAttachment(
                    filename=att.filename,
                    content_type=att.content_type,
                    size=att.size,
                    data=att.payload
                ))
            
            # Extract thread ID from References or In-Reply-To if present
            thread_id = None
            if msg.headers.get("references"):
                refs = msg.headers.get("references", [""])[0].split()
                if refs:
                    thread_id = refs[0] # Usually the first reference is the root of the thread

            parsed_msg = EmailMessageData(
                message_id=msg.uid,
                thread_id=thread_id,
                sender=msg.from_,
                recipients=list(msg.to),
                cc=list(msg.cc),
                bcc=list(msg.bcc),
                subject=msg.subject,
                body_text=msg.text,
                body_html=msg.html,
                date=msg.date,
                attachments=attachments
            )
            messages.append(parsed_msg)
        return messages

    def fetch_message(self, message_id: str, folder: str = "INBOX") -> Optional[EmailMessageData]:
        if not self.mailbox:
            raise Exception("Not connected to IMAP server")
        self.mailbox.folder.set(folder)
        for msg in self.mailbox.fetch(AND(uid=message_id)):
            attachments = []
            for att in msg.attachments:
                attachments.append(EmailAttachment(
                    filename=att.filename,
                    content_type=att.content_type,
                    size=att.size,
                    data=att.payload
                ))
            return EmailMessageData(
                message_id=msg.uid,
                sender=msg.from_,
                recipients=list(msg.to),
                cc=list(msg.cc),
                bcc=list(msg.bcc),
                subject=msg.subject,
                body_text=msg.text,
                body_html=msg.html,
                date=msg.date,
                attachments=attachments
            )
        return None

    def mark_read(self, message_id: str, folder: str = "INBOX") -> bool:
        if not self.mailbox:
            raise Exception("Not connected to IMAP server")
        self.mailbox.folder.set(folder)
        self.mailbox.flag(message_id, '\\Seen', True)
        return True

    def mark_unread(self, message_id: str, folder: str = "INBOX") -> bool:
        if not self.mailbox:
            raise Exception("Not connected to IMAP server")
        self.mailbox.folder.set(folder)
        self.mailbox.flag(message_id, '\\Seen', False)
        return True

    def move_message(self, message_id: str, source_folder: str, dest_folder: str) -> bool:
        if not self.mailbox:
            raise Exception("Not connected to IMAP server")
        self.mailbox.folder.set(source_folder)
        self.mailbox.move(message_id, dest_folder)
        return True

    def send_message(self, to: List[str], subject: str, body_text: str, body_html: Optional[str] = None, cc: List[str] = [], bcc: List[str] = [], attachments: List[Dict] = []) -> bool:
        raise NotImplementedError("IMAP provider does not send messages. Use SMTPEmailProvider.")
