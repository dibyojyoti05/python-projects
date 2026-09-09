from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, timezone, timedelta
import uuid

from app.api import deps
from app.models.user import User
from app.models.email import EmailMessage, EmailAnalysis, EmailAccount, PriorityEnum
from app.models.task import Task, TaskPriority, TaskStatus
from app.schemas.email import EmailMessageResponse, EmailAnalysisResponse, EmailUpdate

router = APIRouter()

@router.get("/", response_model=List[EmailMessageResponse])
async def read_emails(
    db: AsyncSession = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    folder: Optional[str] = "INBOX",
    filter_by: Optional[str] = Query(None, alias="filter"), # all, urgent, needs_action, important, starred
    category: Optional[str] = None,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve emails belonging to the current user with flexible filtering.
    """
    stmt = (
        select(EmailMessage)
        .join(EmailAccount, EmailMessage.account_id == EmailAccount.id)
        .where(EmailAccount.user_id == current_user.id)
        .options(selectinload(EmailMessage.analysis))
        .order_by(EmailMessage.received_at.desc())
    )

    if folder:
        stmt = stmt.where(EmailMessage.folder == folder)

    if filter_by:
        f = filter_by.lower()
        if f == "urgent":
            stmt = stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id).where(
                EmailAnalysis.priority == PriorityEnum.URGENT
            )
        elif f == "important":
            stmt = stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id).where(
                or_(
                    EmailAnalysis.priority == PriorityEnum.HIGH,
                    EmailAnalysis.priority == PriorityEnum.URGENT
                )
            )
        elif f == "needs_action":
            stmt = stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id).where(
                EmailAnalysis.requires_response == True
            )
        elif f == "starred":
            stmt = stmt.where(EmailMessage.is_starred == True)

    if category and category.lower() != "all":
        # Only join analysis if not already joined
        if not filter_by or filter_by.lower() not in ["urgent", "important", "needs_action"]:
            stmt = stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id)
        stmt = stmt.where(func.lower(EmailAnalysis.category) == category.lower())

    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    emails = result.scalars().all()
    return emails

@router.get("/stats/summary")
async def get_email_stats(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Calculate summary metrics for the user's dashboard.
    """
    base_stmt = (
        select(EmailMessage)
        .join(EmailAccount, EmailMessage.account_id == EmailAccount.id)
        .where(EmailAccount.user_id == current_user.id)
    )
    
    total_res = await db.execute(select(func.count()).select_from(base_stmt.subquery()))
    total = total_res.scalar() or 0

    unread_stmt = base_stmt.where(EmailMessage.is_read == False)
    unread_res = await db.execute(select(func.count()).select_from(unread_stmt.subquery()))
    unread = unread_res.scalar() or 0

    urgent_stmt = (
        base_stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id)
        .where(EmailAnalysis.priority == PriorityEnum.URGENT)
    )
    urgent_res = await db.execute(select(func.count()).select_from(urgent_stmt.subquery()))
    urgent = urgent_res.scalar() or 0

    important_stmt = (
        base_stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id)
        .where(or_(EmailAnalysis.priority == PriorityEnum.HIGH, EmailAnalysis.priority == PriorityEnum.URGENT))
    )
    important_res = await db.execute(select(func.count()).select_from(important_stmt.subquery()))
    important = important_res.scalar() or 0

    action_stmt = (
        base_stmt.join(EmailAnalysis, EmailMessage.id == EmailAnalysis.message_id)
        .where(EmailAnalysis.requires_response == True)
    )
    action_res = await db.execute(select(func.count()).select_from(action_stmt.subquery()))
    needs_action = action_res.scalar() or 0

    return {
        "total": total,
        "unread": unread,
        "urgent": urgent,
        "important": important,
        "needs_action": needs_action,
    }

@router.get("/{id}", response_model=EmailMessageResponse)
async def read_email(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get email by ID with full analysis.
    """
    try:
        email_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    stmt = (
        select(EmailMessage)
        .join(EmailAccount, EmailMessage.account_id == EmailAccount.id)
        .where(EmailMessage.id == email_uuid, EmailAccount.user_id == current_user.id)
        .options(selectinload(EmailMessage.analysis))
    )
    result = await db.execute(stmt)
    email = result.scalars().first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    return email

@router.patch("/{id}", response_model=EmailMessageResponse)
async def update_email(
    *,
    db: AsyncSession = Depends(deps.get_db),
    id: str,
    update_data: EmailUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update email status (read/unread, starred, folder).
    """
    try:
        email_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    stmt = (
        select(EmailMessage)
        .join(EmailAccount, EmailMessage.account_id == EmailAccount.id)
        .where(EmailMessage.id == email_uuid, EmailAccount.user_id == current_user.id)
        .options(selectinload(EmailMessage.analysis))
    )
    result = await db.execute(stmt)
    email = result.scalars().first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")

    if update_data.is_read is not None:
        email.is_read = update_data.is_read
    if update_data.is_starred is not None:
        email.is_starred = update_data.is_starred
    if update_data.folder is not None:
        email.folder = update_data.folder

    await db.commit()
    await db.refresh(email)
    return email

@router.post("/seed-demo")
async def seed_demo_emails(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Seed realistic smart emails with full AI analysis and linked tasks for the current user.
    """
    # 1. Ensure an EmailAccount exists for the user
    acc_stmt = select(EmailAccount).where(EmailAccount.user_id == current_user.id)
    acc_res = await db.execute(acc_stmt)
    account = acc_res.scalars().first()
    if not account:
        account = EmailAccount(
            user_id=current_user.id,
            email_address=current_user.email,
            provider="Gmail",
            is_active=True
        )
        db.add(account)
        await db.commit()
        await db.refresh(account)

    now = datetime.now(timezone.utc)
    
    demo_emails_data = [
        {
            "sender": "Rahul Sharma <rahul.sharma@apexenterprises.com>",
            "recipients": [current_user.email],
            "subject": "Urgent: Website Redesign Proposal & Timeline Confirmation",
            "body_text": (
                "Hi there,\n\nThanks for reaching out earlier this week. Our executive board reviewed the preliminary scope, "
                "and we are very keen to proceed with the redesign. However, we need the final proposal and milestones breakdown "
                "by this Friday at 5 PM EST. Our allocated budget is capped at $45,000.\n\nPlease confirm if you can meet this deadline "
                "and send over the contract draft.\n\nBest regards,\nRahul Sharma\nVP of Product, Apex Enterprises"
            ),
            "received_at": now - timedelta(hours=2),
            "priority": PriorityEnum.URGENT,
            "category": "Client",
            "intent": "Proposal Request",
            "summary": "Client board approved preliminary scope and requests the final proposal, milestones breakdown, and contract draft by Friday 5 PM EST ($45k budget).",
            "key_points": [
                "Budget approved up to $45,000",
                "Hard deadline for final proposal: Friday, 5:00 PM EST",
                "Requires contract draft and milestones breakdown"
            ],
            "requires_response": True,
            "suggested_response": "Hi Rahul, thank you for the confirmation! We are delighted to collaborate. I have finalized the milestones schedule within your $45,000 budget and will deliver the complete proposal and draft contract well before Friday 5 PM.",
            "action_items": ["Prepare final website proposal", "Finalize $45k budget allocation", "Draft contract before Friday"],
            "task_title": "Send Apex Website Proposal & Draft Contract"
        },
        {
            "sender": "Talent Acquisition <careers@innovatetech.io>",
            "recipients": [current_user.email],
            "subject": "Interview Confirmation: Senior AI Platform Architect",
            "body_text": (
                "Hello,\n\nWe were extremely impressed by your experience and portfolio! We would like to invite you to the "
                "Technical Architecture Round with our Principal Staff Architect.\n\nDate: Tomorrow at 2:00 PM - 3:00 PM PST\n"
                "Meeting Link: https://meet.google.com/xyz-tech-round\n\nPlease review the system architecture diagram attached "
                "prior to the session.\n\nWarm regards,\nInnovateTech Hiring Team"
            ),
            "received_at": now - timedelta(hours=5),
            "priority": PriorityEnum.HIGH,
            "category": "Interview",
            "intent": "Interview Scheduling",
            "summary": "Technical Architecture round confirmed for tomorrow 2:00 PM PST with Principal Architect. Preparation required on system diagrams.",
            "key_points": [
                "Interview tomorrow 2:00 PM - 3:00 PM PST",
                "Focus on Technical Architecture",
                "Preparation required: review system architecture diagram"
            ],
            "requires_response": True,
            "suggested_response": "Hello Hiring Team, thank you for this exciting opportunity. I confirm my availability for tomorrow at 2:00 PM PST and will review the architecture materials beforehand.",
            "action_items": ["Review InnovateTech architecture diagram", "Prepare system design talking points for 2 PM"],
            "task_title": "Prepare for InnovateTech Technical Interview"
        },
        {
            "sender": "Sarah Lee <s.lee@fintechgroup.co>",
            "recipients": [current_user.email],
            "subject": "Follow-up: Q3 API Integration Security Audit",
            "body_text": (
                "Hi,\n\nQuick follow-up regarding the OAuth 2.1 and mTLS compliance checklist for our Q3 integration. "
                "Can you confirm if token revocation endpoints have been verified under simulated network partitions?\n\n"
                "Let us know your availability for a 15-minute sync on Thursday.\n\nCheers,\nSarah"
            ),
            "received_at": now - timedelta(days=1),
            "priority": PriorityEnum.MEDIUM,
            "category": "Project",
            "intent": "Status Inquiry",
            "summary": "Sarah inquiring on OAuth 2.1 / mTLS security compliance and requesting a 15-min sync Thursday.",
            "key_points": [
                "Verify token revocation under network partition test",
                "Sync requested for Thursday"
            ],
            "requires_response": True,
            "suggested_response": "Hi Sarah, our integration tests for token revocation under partition have passed with 100% compliance. I am available Thursday at 11:00 AM or 3:00 PM for a quick sync.",
            "action_items": ["Send token revocation test logs to Sarah", "Schedule Thursday sync"],
            "task_title": "Coordinate Q3 Security Audit review with Sarah"
        },
        {
            "sender": "AWS Billing Alerts <no-reply-aws@amazon.com>",
            "recipients": [current_user.email],
            "subject": "AWS Budget Notification: 85% of Forecast Reached",
            "body_text": (
                "Dear Customer,\n\nYou have exceeded 85% of your forecasted monthly budget for EC2 & RDS services. "
                "Current accrued charges: $340.20 of $400.00 budgeted amount. Please review your active instances to avoid overage."
            ),
            "received_at": now - timedelta(days=2),
            "priority": PriorityEnum.LOW,
            "category": "Notification",
            "intent": "Budget Alert",
            "summary": "AWS budget alert: 85% of $400 limit reached ($340.20 spent) primarily on EC2 and RDS.",
            "key_points": [
                "Current spend: $340.20",
                "Budget threshold: 85% of $400"
            ],
            "requires_response": False,
            "suggested_response": None,
            "action_items": ["Check unused AWS RDS or dev EC2 instances"],
            "task_title": "Review AWS resources to avoid budget overrun"
        }
    ]

    created_emails = []
    for item in demo_emails_data:
        msg = EmailMessage(
            account_id=account.id,
            provider_message_id=str(uuid.uuid4()),
            sender=item["sender"],
            recipients=item["recipients"],
            subject=item["subject"],
            body_text=item["body_text"],
            received_at=item["received_at"],
            is_read=False,
            is_starred=item["priority"] in [PriorityEnum.URGENT, PriorityEnum.HIGH],
            folder="INBOX"
        )
        db.add(msg)
        await db.flush()

        analysis = EmailAnalysis(
            message_id=msg.id,
            category=item["category"],
            priority=item["priority"],
            intent=item["intent"],
            short_summary=item["summary"],
            key_points=item["key_points"],
            requires_response=item["requires_response"],
            suggested_response=item["suggested_response"],
            action_items=item["action_items"],
            analysis_version="2.5-flash"
        )
        db.add(analysis)

        # Create linked task
        task = Task(
            user_id=current_user.id,
            source_email_id=msg.id,
            title=item["task_title"],
            description=item["summary"],
            deadline=now + timedelta(days=2),
            priority=TaskPriority.HIGH if item["priority"] in [PriorityEnum.URGENT, PriorityEnum.HIGH] else TaskPriority.MEDIUM,
            status=TaskStatus.PENDING
        )
        db.add(task)
        created_emails.append(msg)

    await db.commit()
    return {"message": f"Successfully seeded {len(created_emails)} smart emails and action tasks"}
