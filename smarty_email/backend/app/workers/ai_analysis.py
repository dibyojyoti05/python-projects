import asyncio
import logging
from sqlalchemy import select
from celery import shared_task
from typing import List, Dict

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.email import EmailMessage, EmailAnalysis, PriorityEnum
from app.models.task import Task, TaskPriority, TaskStatus
from app.services.ai.gemini_provider import GeminiProvider

logger = logging.getLogger(__name__)

async def analyze_email_async(message_id: str):
    if not settings.GEMINI_API_KEY:
        logger.warning("No GEMINI_API_KEY set. Skipping AI analysis.")
        return
        
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(EmailMessage).where(EmailMessage.id == message_id))
        msg = result.scalars().first()
        
        if not msg:
            logger.error(f"Message {message_id} not found")
            return
            
        ai = GeminiProvider(api_key=settings.GEMINI_API_KEY)
        
        try:
            # 1. Classify
            classification = await ai.classify_email(msg.subject, msg.body_text[:2000]) # truncated for cost/speed
            
            # 2. Analyze (Summary, Entities, Action Items)
            analysis_result = await ai.analyze_email(msg.subject, msg.body_text[:5000])
            
            # Ensure priority maps to enum
            priority_str = classification.priority.upper()
            if priority_str not in [e.value for e in PriorityEnum]:
                priority_str = PriorityEnum.MEDIUM.value
            
            # Save Analysis
            analysis = EmailAnalysis(
                message_id=msg.id,
                category=classification.category,
                priority=PriorityEnum(priority_str),
                intent=classification.intent,
                short_summary=analysis_result.short_summary,
                key_points=analysis_result.key_points,
                requires_response=classification.requires_response,
                suggested_response=analysis_result.suggested_response,
                entities=analysis_result.entities.model_dump() if analysis_result.entities else None,
                action_items=[a.model_dump() for a in analysis_result.action_items] if analysis_result.action_items else None,
                analysis_version="1.0"
            )
            db.add(analysis)
            
            # Create automated tasks from action items (optional)
            # Typically requires user approval, but if user has automation enabled, we do it.
            # Here we just save them for the UI to propose them.
            
            await db.commit()
            logger.info(f"AI Analysis complete for {message_id}")
            
        except Exception as e:
            logger.error(f"Error analyzing email {message_id}: {e}")

@shared_task(name="analyze_email")
def analyze_email_task(message_id: str):
    """Celery task to analyze an email."""
    loop = asyncio.get_event_loop()
    loop.run_until_complete(analyze_email_async(message_id))
    return f"Analysis complete for {message_id}"
