import asyncio
import uuid
import logging
from celery import Celery
from app.core.config import settings

logger = logging.getLogger(__name__)

celery_app = Celery(
    "worker",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0"
)

celery_app.conf.task_routes = {
    "app.worker.test_celery": "main-queue",
    "app.worker.send_email_campaign": "email-queue",
}

@celery_app.task(acks_late=True)
def test_celery(word: str) -> str:
    return f"test task return {word}"

@celery_app.task(acks_late=True, max_retries=3)
def send_email_campaign(campaign_id: str, provider_id: str = None):
    """
    Celery background worker task to dispatch campaign emails.
    """
    from app.services.email_service import email_service
    from app.db.session import async_sessionmaker, engine
    from app.models.campaign import Campaign, CampaignStatus
    from app.models.contact import Contact
    from sqlalchemy import select

    logger.info(f"Worker beginning async dispatch for campaign {campaign_id}")

    async def _process_dispatch():
        async_session = async_sessionmaker(engine, expire_on_commit=False)
        async with async_session() as session:
            # Fetch campaign
            c_uuid = uuid.UUID(campaign_id)
            res = await session.execute(select(Campaign).filter(Campaign.id == c_uuid))
            campaign = res.scalars().first()
            if not campaign:
                logger.error(f"Campaign {campaign_id} not found in database.")
                return False

            # Fetch contacts
            res = await session.execute(
                select(Contact).filter(Contact.user_id == campaign.user_id, Contact.is_subscribed == True)
            )
            contacts = res.scalars().all()

            campaign.status = CampaignStatus.SENDING
            await session.commit()

            sent_count = 0
            for contact in contacts:
                context = {
                    "first_name": contact.first_name or "Valued Customer",
                    "last_name": contact.last_name or "",
                    "email": contact.email,
                }
                body = email_service.render_content(campaign.content_html, context)
                subj = email_service.render_content(campaign.subject, context)
                email_service.send_email(
                    to_email=contact.email,
                    subject=subj,
                    html_body=body,
                    text_body=campaign.content_text,
                )
                sent_count += 1

            campaign.status = CampaignStatus.COMPLETED
            await session.commit()
            logger.info(f"Campaign {campaign_id} dispatched to {sent_count} contacts.")
            return True

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(_process_dispatch())
    finally:
        loop.close()
