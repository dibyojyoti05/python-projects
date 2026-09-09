import json
from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.models.email import EmailMessage, EmailAnalysis, EmailAccount
from app.schemas.search import SearchFilters
from app.schemas.email import EmailMessageResponse

router = APIRouter()

@router.get("/", response_model=List[EmailMessageResponse])
@router.post("/", response_model=List[EmailMessageResponse])
async def search_emails(
    *,
    db: AsyncSession = Depends(deps.get_db),
    q: Optional[str] = None,
    query: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Search emails using keyword matching and AI filters with graceful fallback.
    """
    search_query = q or query or ""
    search_query = search_query.strip()

    stmt = (
        select(EmailMessage)
        .join(EmailAccount, EmailMessage.account_id == EmailAccount.id)
        .where(EmailAccount.user_id == current_user.id)
        .options(selectinload(EmailMessage.analysis))
        .order_by(EmailMessage.received_at.desc())
    )

    if not search_query:
        result = await db.execute(stmt.limit(50))
        return result.scalars().all()

    # Try Gemini NLP filter extraction if API key is provided
    filters_applied = None
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f'Convert the following natural language query into a structured search filter object: "{search_query}"'
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SearchFilters,
                    temperature=0.0
                )
            )
            filters_dict = json.loads(response.text)
            filters_applied = SearchFilters(**filters_dict)
        except Exception:
            filters_applied = None

    if filters_applied:
        stmt = stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id, isouter=True)
        if filters_applied.category:
            stmt = stmt.where(EmailAnalysis.category == filters_applied.category)
        if filters_applied.priority:
            stmt = stmt.where(EmailAnalysis.priority == filters_applied.priority)
        if filters_applied.requires_response is not None:
            stmt = stmt.where(EmailAnalysis.requires_response == filters_applied.requires_response)
        if filters_applied.is_read is not None:
            stmt = stmt.where(EmailMessage.is_read == filters_applied.is_read)
        if filters_applied.sender_contains:
            stmt = stmt.where(EmailMessage.sender.ilike(f"%{filters_applied.sender_contains}%"))
    else:
        # Standard keyword search
        term = f"%{search_query}%"
        stmt = stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id, isouter=True).where(
            or_(
                EmailMessage.subject.ilike(term),
                EmailMessage.sender.ilike(term),
                EmailMessage.body_text.ilike(term),
                EmailAnalysis.category.ilike(term),
                EmailAnalysis.short_summary.ilike(term)
            )
        )

    result = await db.execute(stmt.limit(50))
    return result.scalars().all()
