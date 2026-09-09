from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies
from app.crud import crud_chat
from app.schemas.chat import Chat, ChatCreate, ChatUpdate, ChatList, MessageCreate
from app.models.user import User
from app.ai.streaming import generate_chat_stream
from app.ai.tools import agent_tools

router = APIRouter()

@router.get("/", response_model=List[ChatList])
@router.get("", response_model=List[ChatList], include_in_schema=False)
async def read_chats(
    db: AsyncSession = Depends(dependencies.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Retrieve user chats.
    """
    chats = await crud_chat.get_user_chats(db, user_id=current_user.id, skip=skip, limit=limit)
    return chats

@router.post("/", response_model=Chat)
@router.post("", response_model=Chat, include_in_schema=False)
async def create_chat(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    chat_in: ChatCreate,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Create new chat.
    """
    chat = await crud_chat.create_chat(db, obj_in=chat_in, user_id=current_user.id)
    return chat

@router.get("/{id}", response_model=Chat)
async def read_chat(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Get chat by ID.
    """
    chat = await crud_chat.get_chat(db, chat_id=id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    return chat

@router.put("/{id}", response_model=Chat)
async def update_chat(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    chat_in: ChatUpdate,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Update a chat.
    """
    chat = await crud_chat.get_chat(db, chat_id=id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    chat = await crud_chat.update_chat(db, db_obj=chat, obj_in=chat_in)
    return chat

@router.delete("/{id}", response_model=Chat)
async def delete_chat(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Delete a chat.
    """
    chat = await crud_chat.get_chat(db, chat_id=id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")
    chat = await crud_chat.delete_chat(db, id=id)
    return chat

class ChatMessageRequest(BaseModel):
    content: str

@router.post("/{id}/messages/stream")
async def stream_chat_message(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    id: int,
    request: ChatMessageRequest,
    current_user: User = Depends(dependencies.get_current_active_user),
):
    """
    Send a message to a chat and stream the AI response.
    """
    chat = await crud_chat.get_chat(db, chat_id=id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=400, detail="Not enough permissions")

    # Auto-title chat from first message if still default
    if chat.title == "New Chat" and request.content.strip():
        new_title = request.content.strip()[:35] + ("..." if len(request.content.strip()) > 35 else "")
        await crud_chat.update_chat(db, db_obj=chat, obj_in=ChatUpdate(title=new_title))

    # 1. Save user message to DB
    user_msg_in = MessageCreate(chat_id=id, role="user", content=request.content)
    await crud_chat.create_message(db, obj_in=user_msg_in)

    # 2. Build history for AI (ensure strict chronological order and recent context)
    all_msgs = await crud_chat.get_chat_messages(db, chat_id=id)
    messages_for_ai = []
    # Limit to the last 20 messages to prevent prompt degradation or context bloat
    for msg in all_msgs[-20:]:
        messages_for_ai.append({"role": msg.role, "content": msg.content})

    # Ensure the conversation sent to the AI always ends with the latest user query
    if not messages_for_ai or messages_for_ai[-1]["role"] != "user":
        messages_for_ai.append({"role": "user", "content": request.content})

    # 3. Stream response
    return StreamingResponse(
        generate_chat_stream(
            model=chat.model_name,
            messages=messages_for_ai,
            tools=None,
            db_session=None,
            chat_id=id
        ),
        media_type="text/event-stream"
    )
