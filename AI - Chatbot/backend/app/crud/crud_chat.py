from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.chat import Chat, Message
from app.schemas.chat import ChatCreate, ChatUpdate, MessageCreate

async def get_chat(db: AsyncSession, chat_id: int) -> Optional[Chat]:
    result = await db.execute(
        select(Chat).options(selectinload(Chat.messages)).filter(Chat.id == chat_id)
    )
    return result.scalars().first()

async def get_user_chats(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Chat]:
    result = await db.execute(
        select(Chat)
        .filter(Chat.user_id == user_id)
        .order_by(Chat.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())

async def create_chat(db: AsyncSession, obj_in: ChatCreate, user_id: int) -> Chat:
    db_obj = Chat(
        title=obj_in.title,
        model_name=obj_in.model_name,
        workspace_id=obj_in.workspace_id,
        user_id=user_id
    )
    db.add(db_obj)
    await db.commit()
    return await get_chat(db, chat_id=db_obj.id)

async def update_chat(
    db: AsyncSession, db_obj: Chat, obj_in: ChatUpdate
) -> Chat:
    update_data = obj_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_obj, field, update_data[field])
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_chat(db: AsyncSession, id: int) -> Chat:
    obj = await get_chat(db, chat_id=id)
    if obj:
        await db.delete(obj)
        await db.commit()
    return obj

async def create_message(db: AsyncSession, obj_in: MessageCreate) -> Message:
    db_obj = Message(
        chat_id=obj_in.chat_id,
        role=obj_in.role,
        content=obj_in.content,
        metadata_json=obj_in.metadata_json
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_chat_messages(db: AsyncSession, chat_id: int) -> List[Message]:
    result = await db.execute(
        select(Message).filter(Message.chat_id == chat_id).order_by(Message.id.asc())
    )
    return list(result.scalars().all())

