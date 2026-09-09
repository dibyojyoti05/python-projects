import asyncio
from app.db.database import AsyncSessionLocal
from app.crud.crud_user import create_user
from app.schemas.user import UserCreate

async def main():
    async with AsyncSessionLocal() as db:
        user_in = UserCreate(
            email="test@example.com",
            password="password123",
            full_name="Test User",
            is_superuser=True
        )
        try:
            user = await create_user(db, user_in)
            print(f"User created: {user.email}")
        except Exception as e:
            print(f"Error creating user: {e}")

if __name__ == "__main__":
    asyncio.run(main())
