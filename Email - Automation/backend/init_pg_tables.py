import asyncio
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.db.session import engine
from app.db.base_class import Base
import app.models  # register all models: User, Contact, Campaign, Workflow, EmailProvider

async def init_tables():
    print(f"Connecting to database: {settings.async_database_uri} ...")
    async with engine.begin() as conn:
        print("Creating all tables from SQLAlchemy models...")
        await conn.run_sync(Base.metadata.create_all)
        print("Tables created successfully!")

    # Verify tables
    from sqlalchemy import text
    async with engine.connect() as conn:
        result = await conn.execute(
            text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        )
        tables = [row[0] for row in result.fetchall()]
        print("\nVerified tables in 'email_automation' database:")
        for t in sorted(tables):
            print(f" - {t}")

    # Create default demo user if users table is empty
    from app.db.session import AsyncSessionLocal
    from app.models.user import User, UserRole
    from app.core.security import get_password_hash
    from sqlalchemy import select

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).limit(1))
        existing_user = result.scalars().first()
        if not existing_user:
            admin_user = User(
                email="admin@example.com",
                hashed_password=get_password_hash("password123"),
                full_name="Admin User",
                role=UserRole.ADMIN,
                is_active=True,
            )
            session.add(admin_user)
            await session.commit()
            print("\nCreated initial admin user: admin@example.com / password123")
        else:
            print(f"\nUser table already contains user: {existing_user.email}")

if __name__ == "__main__":
    asyncio.run(init_tables())
