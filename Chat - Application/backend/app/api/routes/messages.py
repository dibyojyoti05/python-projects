from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, desc
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.message import Message
from app.models.conversation import ConversationMember
from app.schemas.message import MessagePublic
from app.api.dependencies.auth import get_current_active_user

router = APIRouter()

@router.get("/{conversation_id}/messages", response_model=List[MessagePublic])
async def get_messages(
    conversation_id: int,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify membership
    stmt = select(ConversationMember).where(
        and_(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id == current_user.id
        )
    )
    if not (await db.execute(stmt)).scalars().first():
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
        
    # Fetch messages
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(stmt)
    messages = result.scalars().all()
    
    # Needs sender info populated - simpler to just do it via relationship or manual matching
    # Since we are using SQLAlchemy async, we will just manually fetch the users for now
    # or rely on a join. Let's do a fast manual fetch.
    sender_ids = list(set([m.sender_id for m in messages if m.sender_id]))
    if sender_ids:
        users = (await db.execute(select(User).where(User.id.in_(sender_ids)))).scalars().all()
        user_map = {u.id: u for u in users}
    else:
        user_map = {}
        
    # Fetch other members' last read IDs to calculate is_read
    other_members_stmt = select(ConversationMember).where(
        and_(
            ConversationMember.conversation_id == conversation_id,
            ConversationMember.user_id != current_user.id
        )
    )
    other_members = (await db.execute(other_members_stmt)).scalars().all()
    max_other_read_id = max([m.last_read_message_id or 0 for m in other_members], default=0)
        
    response = []
    for m in messages:
        m_dict = {
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "content": m.content,
            "message_type": m.message_type,
            "reply_to_id": m.reply_to_id,
            "created_at": m.created_at,
            "updated_at": m.updated_at,
            "edited_at": m.edited_at,
            "deleted_at": m.deleted_at,
            "sender": user_map.get(m.sender_id),
            "is_read": bool(m.id <= max_other_read_id)
        }
        response.append(m_dict)
        
    # Return reversed so they are chronologically ordered for UI
    return response[::-1]

@router.post("/{message_id}/read")
async def mark_message_read(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Get the message
    msg = (await db.execute(select(Message).where(Message.id == message_id))).scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    # Verify membership
    stmt = select(ConversationMember).where(
        and_(
            ConversationMember.conversation_id == msg.conversation_id,
            ConversationMember.user_id == current_user.id
        )
    )
    member = (await db.execute(stmt)).scalars().first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Update last read
    member.last_read_message_id = message_id
    
    # Broadcast to others
    from app.websocket.manager import manager
    read_event = {
        "type": "message:read",
        "payload": {
            "conversation_id": msg.conversation_id,
            "message_id": message_id,
            "user_id": current_user.id
        }
    }
    
    members_stmt = select(ConversationMember.user_id).where(ConversationMember.conversation_id == msg.conversation_id)
    member_ids = (await db.execute(members_stmt)).scalars().all()
    for m_id in member_ids:
        if m_id != current_user.id:
            await manager.send_to_user(m_id, read_event)
            
    await db.commit()
    return {"status": "success"}

from datetime import datetime
from app.schemas.message import MessageUpdate

@router.patch("/{message_id}", response_model=MessagePublic)
async def update_message(
    message_id: int,
    message_in: MessageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    msg = (await db.execute(select(Message).where(Message.id == message_id))).scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this message")
        
    if msg.deleted_at is not None:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted message")
        
    msg.content = message_in.content
    from sqlalchemy.sql import func
    msg.edited_at = func.now()
    
    await db.commit()
    await db.refresh(msg)
    
    from app.websocket.manager import manager
    edit_event = {
        "type": "message:edited",
        "payload": {
            "conversation_id": msg.conversation_id,
            "message_id": msg.id,
            "content": msg.content,
            "edited_at": msg.edited_at.isoformat() if isinstance(msg.edited_at, datetime) else str(msg.edited_at)
        }
    }
    
    members_stmt = select(ConversationMember.user_id).where(ConversationMember.conversation_id == msg.conversation_id)
    member_ids = (await db.execute(members_stmt)).scalars().all()
    for m_id in member_ids:
        await manager.send_to_user(m_id, edit_event)
        
    # Hack to return sender, since schemas demand it usually or we can just omit it
    # We will just return the message and let the client update their local cache
    user_pub = UserPublic.model_validate(current_user).model_dump(mode="json")
    msg_dict = msg.__dict__.copy()
    msg_dict["sender"] = user_pub
    msg_dict["is_read"] = False
    return msg_dict

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    msg = (await db.execute(select(Message).where(Message.id == message_id))).scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    if msg.sender_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this message")
        
    from sqlalchemy.sql import func
    msg.deleted_at = func.now()
    msg.content = "This message was deleted"
    
    await db.commit()
    await db.refresh(msg)
    
    from app.websocket.manager import manager
    delete_event = {
        "type": "message:deleted",
        "payload": {
            "conversation_id": msg.conversation_id,
            "message_id": msg.id,
            "deleted_at": msg.deleted_at.isoformat() if isinstance(msg.deleted_at, datetime) else str(msg.deleted_at)
        }
    }
    
    members_stmt = select(ConversationMember.user_id).where(ConversationMember.conversation_id == msg.conversation_id)
    member_ids = (await db.execute(members_stmt)).scalars().all()
    for m_id in member_ids:
        await manager.send_to_user(m_id, delete_event)
        
    return {"status": "success"}
