import asyncio
import logging
from sqlalchemy import select
from celery import shared_task

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.email import EmailAccount, EmailMessage
from app.services.email.imap_provider import IMAPEmailProvider
from app.workers.ai_analysis import analyze_email_task

logger = logging.getLogger(__name__)

async def sync_emails_for_account_async(account_id: str):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(EmailAccount).where(EmailAccount.id == account_id))
        account = result.scalars().first()
        
        if not account or not account.is_active:
            logger.error(f"Account {account_id} not found or inactive")
            return

        if account.provider.upper() != "IMAP":
            logger.error(f"Provider {account.provider} not supported for direct sync yet")
            return
            
        provider = IMAPEmailProvider(
            host=account.host,
            user=account.email_address,
            password=account.encrypted_password, # In real app, decrypt this first
            port=int(account.port) if account.port else 993
        )
        
        try:
            provider.connect()
            # Fetch last 50 emails
            messages = provider.fetch_messages(limit=50)
            
            new_emails_count = 0
            for msg_data in messages:
                # Check if exists
                existing = await db.execute(select(EmailMessage).where(EmailMessage.provider_message_id == msg_data.message_id))
                if existing.scalars().first():
                    continue # Already synced
                
                # Save new message
                db_msg = EmailMessage(
                    account_id=account.id,
                    provider_message_id=msg_data.message_id,
                    thread_id=msg_data.thread_id,
                    sender=msg_data.sender,
                    recipients=msg_data.recipients,
                    cc=msg_data.cc,
                    bcc=msg_data.bcc,
                    subject=msg_data.subject,
                    body_text=msg_data.body_text,
                    body_html=msg_data.body_html,
                    received_at=msg_data.date,
                    is_read=False,
                    folder="INBOX"
                )
                db.add(db_msg)
                await db.commit()
                await db.refresh(db_msg)
                new_emails_count += 1
                
                # Queue for AI analysis
                analyze_email_task.delay(str(db_msg.id))
                
            logger.info(f"Synced {new_emails_count} new emails for account {account_id}")
            
        except Exception as e:
            logger.error(f"Error syncing emails for {account_id}: {e}")
        finally:
            provider.disconnect()

@shared_task(name="sync_emails_for_account")
def sync_emails_for_account_task(account_id: str):
    """Celery task to sync emails for a specific account."""
    loop = asyncio.get_event_loop()
    loop.run_until_complete(sync_emails_for_account_async(account_id))
    return f"Sync complete for {account_id}"
