from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from jose import jwt, JWTError
import json
import logging

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.conversation import ConversationMember, Conversation
from app.models.message import Message
from app.websocket.manager import manager
from app.schemas.token import TokenPayload
from app.schemas.message import MessagePublic
from app.schemas.user import UserPublic

router = APIRouter()

async def get_ws_user(token: str, db: AsyncSession) -> User | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            return None
        result = await db.execute(select(User).where(User.id == int(token_data.sub)))
        return result.scalars().first()
    except JWTError:
        return None

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Missing token")
        return
        
    async with AsyncSessionLocal() as db:
        user = await get_ws_user(token, db)
        if not user or not user.is_active:
            await websocket.close(code=1008, reason="Unauthorized")
            return
            
        await manager.connect(websocket, user.id)
        
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    payload = json.loads(data)
                except json.JSONDecodeError:
                    continue
                    
                event_type = payload.get("type")
                event_data = payload.get("payload", {})
                
                if event_type == "message:send":
                    # Validate and save message
                    conv_id = event_data.get("conversation_id")
                    content = event_data.get("content")
                    if not conv_id or not content:
                        continue
                        
                    # Verify user is in conversation
                    stmt = select(ConversationMember).where(
                        and_(ConversationMember.conversation_id == conv_id, ConversationMember.user_id == user.id)
                    )
                    if not (await db.execute(stmt)).scalars().first():
                        continue
                        
                    # Save message
                    new_msg = Message(
                        conversation_id=conv_id,
                        sender_id=user.id,
                        content=content
                    )
                    db.add(new_msg)
                    
                    # Update conversation last message time
                    conv = (await db.execute(select(Conversation).where(Conversation.id == conv_id))).scalars().first()
                    if conv:
                        from sqlalchemy.sql import func
                        conv.last_message_at = func.now()
                        
                    await db.commit()
                    await db.refresh(new_msg)
                    
                    # Find all members to broadcast to
                    members_stmt = select(ConversationMember.user_id).where(ConversationMember.conversation_id == conv_id)
                    member_ids = (await db.execute(members_stmt)).scalars().all()
                    
                    user_pub = UserPublic.model_validate(user).model_dump(mode="json")
                    msg_pub = {
                        "id": new_msg.id,
                        "conversation_id": new_msg.conversation_id,
                        "sender_id": new_msg.sender_id,
                        "content": new_msg.content,
                        "message_type": new_msg.message_type,
                        "reply_to_id": new_msg.reply_to_id,
                        "created_at": new_msg.created_at.isoformat() if new_msg.created_at else None,
                        "sender": user_pub
                    }
                    
                    broadcast_event = {
                        "type": "message:new",
                        "payload": msg_pub
                    }
                    
                    for m_id in member_ids:
                        await manager.send_to_user(m_id, broadcast_event)
                        
                elif event_type == "typing:start" or event_type == "typing:stop":
                    conv_id = event_data.get("conversation_id")
                    if conv_id:
                        # Find other members and send typing indicator
                        members_stmt = select(ConversationMember.user_id).where(
                            and_(ConversationMember.conversation_id == conv_id, ConversationMember.user_id != user.id)
                        )
                        member_ids = (await db.execute(members_stmt)).scalars().all()
                        typing_event = {
                            "type": event_type,
                            "payload": {
                                "conversation_id": conv_id,
                                "user_id": user.id
                            }
                        }
                        for m_id in member_ids:
                            await manager.send_to_user(m_id, typing_event)
                            
        except WebSocketDisconnect:
            await manager.disconnect(websocket, user.id)
