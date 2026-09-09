import asyncio
import asyncpg
from datetime import datetime, timezone, timedelta
import uuid
from sqlalchemy.future import select

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import engine, AsyncSessionLocal
from app.models.base import Base
from app.models.user import User
from app.models.email import EmailAccount, EmailMessage, EmailAnalysis, PriorityEnum
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.automation import AutomationRule


async def ensure_database_exists():
    """Connect to default 'postgres' db and create 'mailmind_db' if it doesn't exist."""
    print("Connecting to PostgreSQL at 127.0.0.1:5433 (default db 'postgres')...")
    conn = await asyncpg.connect(
        host="127.0.0.1",
        port=5433,
        user="postgres",
        password="root",
        database="postgres"
    )
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = 'mailmind_db'"
        )
        if not exists:
            print("Database 'mailmind_db' not found. Creating database 'mailmind_db'...")
            await conn.execute("CREATE DATABASE mailmind_db;")
            print("Database 'mailmind_db' successfully created!")
        else:
            print("Database 'mailmind_db' already exists.")
    finally:
        await conn.close()


async def init_schema_and_seed():
    """Create all tables in mailmind_db and seed demo data."""
    print("Connecting to 'mailmind_db' via SQLAlchemy engine...")
    async with engine.begin() as conn:
        print("Creating all tables if they do not exist...")
        await conn.run_sync(Base.metadata.create_all)
        print("All tables created successfully in PostgreSQL!")

    async with AsyncSessionLocal() as session:
        # 1. Seed demo user
        result = await session.execute(
            select(User).where(User.email == "demo@mailmind.ai")
        )
        user = result.scalar_one_or_none()

        if not user:
            print("Creating default demo user (demo@mailmind.ai / password123)...")
            user = User(
                email="demo@mailmind.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Alex Mercer",
                is_active=True,
                is_superuser=True
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created demo user: {user.id}")
        else:
            print(f"Demo user already exists: {user.id}")

        # 2. Check if email account exists
        acc_result = await session.execute(
            select(EmailAccount).where(EmailAccount.user_id == user.id)
        )
        account = acc_result.scalar_one_or_none()
        if not account:
            account = EmailAccount(
                user_id=user.id,
                email_address="alex.mercer@innovatecorp.com",
                provider="Gmail",
                is_active=True
            )
            session.add(account)
            await session.commit()
            await session.refresh(account)
            print(f"Created email account: {account.id}")

        # 3. Seed emails if empty
        msg_result = await session.execute(
            select(EmailMessage).where(EmailMessage.account_id == account.id)
        )
        messages = msg_result.scalars().all()
        if not messages:
            print("Seeding sample AI-classified emails...")
            now = datetime.now(timezone.utc)
            
            sample_emails = [
                {
                    "subject": "URGENT: Q3 Product Roadmap & Budget Approval Required",
                    "sender": "sarah.chen@innovatecorp.com",
                    "recipients": ["alex.mercer@innovatecorp.com"],
                    "body_text": "Hi Alex,\n\nPlease review the attached Q3 Product Roadmap draft before our 4 PM leadership sync today. We need your final sign-off on the Cloud infrastructure budget.",
                    "priority": PriorityEnum.URGENT,
                    "category": "work",
                    "is_read": False,
                    "is_starred": True,
                    "short_summary": "Urgent sign-off required on Q3 Cloud infrastructure budget before 4 PM sync.",
                    "action_items": ["Review Q3 Product Roadmap draft", "Sign-off on Cloud infrastructure budget by 4 PM"],
                    "suggested_response": "Hi Sarah, I reviewed the roadmap and approved the budget. See you at the 4 PM sync.",
                },
                {
                    "subject": "Partnership Proposal - Series A Follow-Up",
                    "sender": "marcus.vance@vanguardventures.io",
                    "recipients": ["alex.mercer@innovatecorp.com"],
                    "body_text": "Dear Alex,\n\nFollowing our conversation in San Francisco, we are excited to submit our formal term sheet for the upcoming Series A co-investment round.",
                    "priority": PriorityEnum.HIGH,
                    "category": "updates",
                    "is_read": False,
                    "is_starred": True,
                    "short_summary": "Marcus Vance submitted formal Series A term sheet for co-investment.",
                    "action_items": ["Share term sheet with legal counsel", "Schedule follow-up call with Marcus Vance"],
                    "suggested_response": "Dear Marcus, thank you for sharing the term sheet. Our legal team is reviewing it and we will circle back by Friday.",
                },
                {
                    "subject": "Invoice #INV-2026-889 Payment Confirmation",
                    "sender": "billing@aws-billing.amazon.com",
                    "recipients": ["alex.mercer@innovatecorp.com"],
                    "body_text": "Thank you for your payment of $1,420.50 for AWS Cloud Services for August 2026. Your statement is available in the billing console.",
                    "priority": PriorityEnum.LOW,
                    "category": "finance",
                    "is_read": True,
                    "is_starred": False,
                    "short_summary": "Receipt for $1,420.50 AWS Cloud Services payment for August 2026.",
                    "action_items": ["Download statement for accounting"],
                    "suggested_response": "Thank you, payment acknowledged.",
                }
            ]

            first_msg_id = None
            for item in sample_emails:
                msg = EmailMessage(
                    account_id=account.id,
                    provider_message_id=f"msg-{uuid.uuid4().hex[:12]}@innovatecorp.com",
                    thread_id=f"thread-{uuid.uuid4().hex[:8]}",
                    sender=item["sender"],
                    recipients=item["recipients"],
                    subject=item["subject"],
                    body_text=item["body_text"],
                    received_at=now,
                    is_read=item["is_read"],
                    is_starred=item["is_starred"],
                    folder="INBOX"
                )
                session.add(msg)
                await session.flush()
                if not first_msg_id:
                    first_msg_id = msg.id

                analysis = EmailAnalysis(
                    message_id=msg.id,
                    category=item["category"],
                    priority=item["priority"],
                    short_summary=item["short_summary"],
                    action_items=item["action_items"],
                    suggested_response=item["suggested_response"],
                    requires_response=True if item["priority"] in [PriorityEnum.URGENT, PriorityEnum.HIGH] else False
                )
                session.add(analysis)

            print(f"Added {len(sample_emails)} sample emails with AI analysis.")

        # 4. Seed sample tasks if empty
        task_res = await session.execute(
            select(Task).where(Task.user_id == user.id)
        )
        tasks = task_res.scalars().all()
        if not tasks:
            sample_tasks = [
                Task(
                    user_id=user.id,
                    title="Review Q3 Product Roadmap draft & sign-off budget",
                    description="Action item extracted from email by Sarah Chen.",
                    priority=TaskPriority.HIGH,
                    deadline=datetime.now(timezone.utc) + timedelta(days=1),
                    status=TaskStatus.PENDING,
                ),
                Task(
                    user_id=user.id,
                    title="Forward Marcus Vance Series A term sheet to legal",
                    description="Term sheet review before Friday sync.",
                    priority=TaskPriority.HIGH,
                    deadline=datetime.now(timezone.utc) + timedelta(days=3),
                    status=TaskStatus.IN_PROGRESS,
                ),
            ]
            session.add_all(sample_tasks)
            print(f"Added {len(sample_tasks)} sample extracted tasks.")

        # 5. Seed sample automation rule if empty
        auto_res = await session.execute(
            select(AutomationRule).where(AutomationRule.user_id == user.id)
        )
        rules = auto_res.scalars().all()
        if not rules:
            rule = AutomationRule(
                user_id=user.id,
                name="Auto-tag and Escalate Urgent Executive Emails",
                conditions={"sentiment": "urgent", "priority": "URGENT"},
                actions={"action_type": "CREATE_TASK", "task_title": "Urgent Review Required"},
                is_active=True
            )
            session.add(rule)
            print("Added default automation rule.")

        await session.commit()
        print("\nSUCCESS! PostgreSQL database 'mailmind_db' is fully provisioned and seeded.")


async def main():
    try:
        await ensure_database_exists()
        await init_schema_and_seed()
    except Exception as e:
        print(f"Error during database initialization: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
