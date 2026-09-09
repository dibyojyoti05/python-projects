from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_
from typing import List

from app.core.database import get_db
from app.models.user import User
from app.models.conversation import Conversation, ConversationMember, ConversationType
from app.schemas.conversation import ConversationPublic, ConversationCreate, ConversationMemberPublic, AddMemberRequest
from app.schemas.user import UserPublic
from app.api.dependencies.auth import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[ConversationPublic])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = (
        select(Conversation)
        .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
        .where(ConversationMember.user_id == current_user.id)
        .order_by(Conversation.last_message_at.desc())
    )
    result = await db.execute(stmt)
    conversations = result.scalars().all()
    
    from app.models.message import Message
    from sqlalchemy.sql import func
    
    # Manually populate other_user for private chats
    response = []
    for conv in conversations:
        # Get member's last_read_message_id
        member_stmt = select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conv.id, ConversationMember.user_id == current_user.id)
        )
        member = (await db.execute(member_stmt)).scalars().first()
        
        # Calculate unread count
        unread_count = 0
        if member and member.last_read_message_id is not None:
            unread_stmt = select(func.count(Message.id)).where(
                and_(Message.conversation_id == conv.id, Message.id > member.last_read_message_id)
            )
            unread_count = (await db.execute(unread_stmt)).scalar()
        elif member:
            unread_stmt = select(func.count(Message.id)).where(Message.conversation_id == conv.id)
            unread_count = (await db.execute(unread_stmt)).scalar()
            
        conv_dict = {
            "id": conv.id,
            "type": conv.type,
            "name": conv.name,
            "group_image": conv.group_image,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "last_message_at": conv.last_message_at,
            "unread_count": unread_count or 0
        }
        
        if conv.type == ConversationType.PRIVATE:
            # Get the other participant
            stmt_other = select(User).join(ConversationMember, User.id == ConversationMember.user_id).where(
                and_(ConversationMember.conversation_id == conv.id, ConversationMember.user_id != current_user.id)
            )
            other_user = (await db.execute(stmt_other)).scalars().first()
            conv_dict["other_user"] = other_user
            
        response.append(conv_dict)
        
    return response

@router.post("/", response_model=ConversationPublic)
async def create_conversation(
    conv_in: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if conv_in.type == ConversationType.PRIVATE:
        # Check if conversation already exists
        # This requires finding a conversation where both users are members and no one else is.
        # Simplified version for now: find private convs with current_user, then check if participant is in them
        stmt = (
            select(Conversation)
            .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
            .where(
                and_(
                    Conversation.type == ConversationType.PRIVATE,
                    ConversationMember.user_id == current_user.id
                )
            )
        )
        my_private_convs = (await db.execute(stmt)).scalars().all()
        
        for conv in my_private_convs:
            stmt_check = select(ConversationMember).where(
                and_(
                    ConversationMember.conversation_id == conv.id,
                    ConversationMember.user_id == conv_in.participant_id
                )
            )
            if (await db.execute(stmt_check)).scalars().first():
                # Found existing
                other_user = (await db.execute(select(User).where(User.id == conv_in.participant_id))).scalars().first()
                conv_dict = {
                    "id": conv.id,
                    "type": conv.type,
                    "name": conv.name,
                    "group_image": conv.group_image,
                    "created_at": conv.created_at,
                    "updated_at": conv.updated_at,
                    "last_message_at": conv.last_message_at,
                    "unread_count": 0,
                    "other_user": other_user
                }
                return conv_dict
                
        # Create new
        new_conv = Conversation(type=ConversationType.PRIVATE)
        db.add(new_conv)
        await db.flush()
        
        member1 = ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="MEMBER")
        member2 = ConversationMember(conversation_id=new_conv.id, user_id=conv_in.participant_id, role="MEMBER")
        db.add(member1)
        db.add(member2)
        
        await db.commit()
        await db.refresh(new_conv)
        
        other_user = (await db.execute(select(User).where(User.id == conv_in.participant_id))).scalars().first()
        
        return {
            "id": new_conv.id,
            "type": new_conv.type,
            "name": new_conv.name,
            "group_image": new_conv.group_image,
            "created_at": new_conv.created_at,
            "updated_at": new_conv.updated_at,
            "last_message_at": new_conv.last_message_at,
            "unread_count": 0,
            "other_user": other_user
        }

from app.schemas.conversation import GroupCreate

@router.post("/group", response_model=ConversationPublic)
async def create_group(
    group_in: GroupCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify other users exist
    if not group_in.participant_ids:
        raise HTTPException(status_code=400, detail="Group must have at least one other participant")
        
    stmt = select(User).where(User.id.in_(group_in.participant_ids))
    users = (await db.execute(stmt)).scalars().all()
    if len(users) != len(set(group_in.participant_ids)):
        raise HTTPException(status_code=404, detail="One or more users not found")
        
    # Create conversation
    new_conv = Conversation(type=ConversationType.GROUP, name=group_in.name)
    db.add(new_conv)
    await db.commit()
    await db.refresh(new_conv)
    
    # Add members
    members_to_add = [
        ConversationMember(conversation_id=new_conv.id, user_id=current_user.id, role="OWNER")
    ]
    for p_id in group_in.participant_ids:
        if p_id != current_user.id:
            members_to_add.append(ConversationMember(conversation_id=new_conv.id, user_id=p_id, role="MEMBER"))
            
    db.add_all(members_to_add)
    await db.commit()
    
    # Broadcast to all members that a new group was created
    from app.websocket.manager import manager
    group_event = {
        "type": "conversation:new",
        "payload": {
            "id": new_conv.id,
            "type": new_conv.type,
            "name": new_conv.name,
            "unread_count": 0
        }
    }
    for member in members_to_add:
        if member.user_id != current_user.id:
            await manager.send_to_user(member.user_id, group_event)
        
    return new_conv

@router.get("/{conversation_id}/members", response_model=List[ConversationMemberPublic])
async def get_conversation_members(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify current user is a member
    membership = (await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == current_user.id)
        )
    )).scalars().first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not authorized to view members")

    # Fetch all members
    members = (await db.execute(
        select(ConversationMember).where(ConversationMember.conversation_id == conversation_id)
    )).scalars().all()

    user_ids = [m.user_id for m in members]
    users = (await db.execute(select(User).where(User.id.in_(user_ids)))).scalars().all()
    user_map = {u.id: u for u in users}

    response = []
    for m in members:
        u = user_map.get(m.user_id)
        u_pub = UserPublic.model_validate(u) if u else None
        response.append({
            "user_id": m.user_id,
            "role": m.role,
            "joined_at": m.joined_at,
            "user": u_pub
        })
    return response

@router.post("/{conversation_id}/members", response_model=ConversationMemberPublic)
async def add_conversation_member(
    conversation_id: int,
    req: AddMemberRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Verify conversation exists and is group
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if conv.type != ConversationType.GROUP:
        raise HTTPException(status_code=400, detail="Cannot add members to private conversation")

    # Verify current user is in group and is OWNER/ADMIN
    cur_member = (await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == current_user.id)
        )
    )).scalars().first()
    if not cur_member or cur_member.role not in ["OWNER", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Only group owner/admin can add members")

    # Check if target user exists
    target_user = (await db.execute(select(User).where(User.id == req.user_id))).scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already member
    existing = (await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == req.user_id)
        )
    )).scalars().first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    new_member = ConversationMember(
        conversation_id=conversation_id,
        user_id=req.user_id,
        role="MEMBER"
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    # Notify new member via WS
    from app.websocket.manager import manager
    group_event = {
        "type": "conversation:new",
        "payload": {
            "id": conv.id,
            "type": conv.type,
            "name": conv.name,
            "unread_count": 0
        }
    }
    await manager.send_to_user(req.user_id, group_event)

    return {
        "user_id": new_member.user_id,
        "role": new_member.role,
        "joined_at": new_member.joined_at,
        "user": UserPublic.model_validate(target_user)
    }

@router.delete("/{conversation_id}/members/{user_id}")
async def remove_conversation_member(
    conversation_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    conv = (await db.execute(select(Conversation).where(Conversation.id == conversation_id))).scalars().first()
    if not conv or conv.type != ConversationType.GROUP:
        raise HTTPException(status_code=400, detail="Invalid group conversation")

    # If leaving own group vs kicking someone
    cur_member = (await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == current_user.id)
        )
    )).scalars().first()
    if not cur_member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    if user_id != current_user.id:
        if cur_member.role not in ["OWNER", "ADMIN"]:
            raise HTTPException(status_code=403, detail="Only owner or admin can remove members")

    target_member = (await db.execute(
        select(ConversationMember).where(
            and_(ConversationMember.conversation_id == conversation_id, ConversationMember.user_id == user_id)
        )
    )).scalars().first()
    if not target_member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(target_member)
    await db.commit()
    return {"status": "success", "message": "Member removed"}

