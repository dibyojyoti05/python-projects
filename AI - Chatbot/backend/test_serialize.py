import asyncio
from app.db.database import AsyncSessionLocal
from app.api.routers.chats import create_chat
from app.schemas.chat import ChatCreate, Chat
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        chat_in = ChatCreate(title="Test", model_name="gemini/gemini-3.6-flash")
        user = User(id=1, email="test@example.com")
        try:
            db_chat = await create_chat(db=db, chat_in=chat_in, current_user=user)
            # Try serializing like FastAPI does
            pydantic_chat = Chat.model_validate(db_chat)
            print("Serialized successfully:", pydantic_chat.id)
        except Exception as e:
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
