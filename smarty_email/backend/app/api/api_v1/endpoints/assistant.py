from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from app.api import deps
from app.core.config import settings
from app.models.user import User
from app.models.email import EmailMessage, EmailAnalysis, EmailAccount, PriorityEnum
from app.models.task import Task
from app.schemas.assistant import ChatRequest, ChatResponse, EmailCitation

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def assistant_chat(
    *,
    db: AsyncSession = Depends(deps.get_db),
    chat_in: ChatRequest,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Interactive AI assistant for querying and taking action on user emails and tasks.
    """
    query = chat_in.message.strip()
    query_lower = query.lower()

    # Retrieve user's recent emails with analysis
    stmt = (
        select(EmailMessage)
        .join(EmailAccount, EmailMessage.account_id == EmailAccount.id)
        .where(EmailAccount.user_id == current_user.id)
        .options(selectinload(EmailMessage.analysis))
        .order_by(EmailMessage.received_at.desc())
        .limit(25)
    )
    result = await db.execute(stmt)
    emails = result.scalars().all()

    # Retrieve user's pending tasks
    task_stmt = select(Task).where(Task.user_id == current_user.id).order_by(Task.created_at.desc()).limit(10)
    task_res = await db.execute(task_stmt)
    tasks = task_res.scalars().all()

    # If Gemini API Key is available, try Gemini
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            context_items = []
            for em in emails:
                ana = em.analysis
                context_items.append(
                    f"Email ID: {em.id}\n"
                    f"Sender: {em.sender}\n"
                    f"Subject: {em.subject}\n"
                    f"Date: {em.received_at.strftime('%b %d, %Y')}\n"
                    f"Category: {ana.category if ana else 'General'}\n"
                    f"Priority: {ana.priority if ana else 'Normal'}\n"
                    f"Requires Response: {ana.requires_response if ana else False}\n"
                    f"Summary: {ana.short_summary if ana else em.body_text[:200]}\n"
                    f"Action Items: {ana.action_items if ana else []}\n"
                    "---"
                )
            context_str = "\n".join(context_items)

            tasks_str = "\n".join([f"- {t.title} (Status: {t.status})" for t in tasks])

            prompt = f"""
            You are MailMind AI, an intelligent executive assistant for the user's inbox and task list.
            
            User Question: "{query}"
            
            Current Inbox Context:
            {context_str}
            
            Current Tasks:
            {tasks_str}
            
            Provide a helpful, concise, well-structured answer. If referencing specific emails, cite the sender and subject.
            """
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2)
            )

            # Match cited emails
            citations = []
            for em in emails:
                if em.subject.lower() in response.text.lower() or em.sender.split("<")[0].strip().lower() in response.text.lower():
                    citations.append(
                        EmailCitation(
                            id=str(em.id),
                            sender=em.sender,
                            subject=em.subject,
                            date=em.received_at.strftime("%b %d"),
                            priority=em.analysis.priority.value if em.analysis and em.analysis.priority else "NORMAL",
                            category=em.analysis.category if em.analysis else "General",
                        )
                    )

            return ChatResponse(
                reply=response.text,
                citations=citations[:3],
                suggested_actions=["Draft quick reply", "Add action items to Tasks"]
            )
        except Exception:
            pass # Fall through to heuristic synthesizer

    # Heuristic contextual responder
    matched_emails = []
    actions = []

    if any(k in query_lower for k in ["client", "proposal", "urgent", "response", "reply"]):
        matched = [e for e in emails if (e.analysis and (e.analysis.category == "Client" or e.analysis.requires_response or e.analysis.priority == PriorityEnum.URGENT))]
        if matched:
            matched_emails = matched[:3]
            reply = f"I found **{len(matched)} message(s)** requiring prompt action or client attention:\n\n"
            for m in matched_emails:
                p_badge = f"[{m.analysis.priority.value}]" if m.analysis and m.analysis.priority else ""
                reply += f"• **{m.subject}** from *{m.sender.split('<')[0].strip()}* {p_badge}\n  _{m.analysis.short_summary if m.analysis else 'Requires review'}_\n\n"
            reply += "Would you like me to draft replies or add these deliverables to your task list?"
            actions = ["Draft reply to urgent proposal", "Create task for client deadline"]
        else:
            reply = "You currently have no urgent unaddressed client inquiries. All client threads are up to date!"
            actions = ["Check upcoming tasks", "Refresh inbox"]

    elif any(k in query_lower for k in ["interview", "job", "career", "hiring"]):
        matched = [e for e in emails if (e.analysis and e.analysis.category == "Interview") or "interview" in e.subject.lower()]
        if matched:
            matched_emails = matched[:3]
            reply = f"I located **{len(matched)} interview confirmation(s)**:\n\n"
            for m in matched_emails:
                reply += f"• **{m.subject}** ({m.received_at.strftime('%b %d')})\n  _{m.analysis.short_summary if m.analysis else m.body_text[:120]}_\n\n"
            reply += "Make sure to review the attached system architecture diagrams before tomorrow's technical session!"
            actions = ["Review interview preparation checklist", "Confirm schedule"]
        else:
            reply = "I didn't find any recent interview scheduling messages in your inbox."
            actions = ["Check all emails", "Search other folders"]

    elif any(k in query_lower for k in ["task", "todo", "action", "pending"]):
        if tasks:
            reply = f"You have **{len(tasks)} active task(s)** tracked:\n\n"
            for t in tasks[:5]:
                status_icon = "✓" if t.status == "COMPLETED" else "○"
                reply += f"{status_icon} **{t.title}** ({t.priority.value if hasattr(t.priority, 'value') else t.priority})\n"
            actions = ["Complete next task", "View all in Kanban/Tasks"]
        else:
            reply = "You have no pending tasks! Great job clearing your inbox obligations."
            actions = ["Scan inbox for new action items"]

    else:
        # General overview
        total_count = len(emails)
        urgent_count = sum(1 for e in emails if e.analysis and e.analysis.priority == PriorityEnum.URGENT)
        reply = (
            f"Here is a summary of your inbox ({total_count} recent message(s)):\n\n"
            f"• **Urgent messages**: {urgent_count}\n"
            f"• **Pending tasks**: {len(tasks)}\n\n"
            "You can ask me to find specific client threads, draft polite responses, or summarize interview schedules!"
        )
        actions = ["Show urgent emails", "Review pending tasks", "Draft response to Rahul"]
        matched_emails = emails[:2]

    citations = [
        EmailCitation(
            id=str(em.id),
            sender=em.sender,
            subject=em.subject,
            date=em.received_at.strftime("%b %d"),
            priority=em.analysis.priority.value if em.analysis and em.analysis.priority else "NORMAL",
            category=em.analysis.category if em.analysis else "General",
        )
        for em in matched_emails
    ]

    return ChatResponse(
        reply=reply,
        citations=citations,
        suggested_actions=actions
    )
