from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.chat import Conversation, Message
from app.schemas.chat import ConversationCreate, MessageCreate

def get_conversation(db: Session, id: int) -> Optional[Conversation]:
    return db.query(Conversation).filter(Conversation.id == id).first()

def get_user_conversations(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Conversation]:
    return db.query(Conversation).filter(Conversation.user_id == user_id).order_by(Conversation.updated_at.desc()).offset(skip).limit(limit).all()

def create_conversation(db: Session, obj_in: ConversationCreate, user_id: int) -> Conversation:
    db_obj = Conversation(title=obj_in.title, user_id=user_id)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_messages(db: Session, conversation_id: int, skip: int = 0, limit: int = 100) -> List[Message]:
    return db.query(Message).filter(Message.conversation_id == conversation_id).order_by(Message.created_at.asc()).offset(skip).limit(limit).all()

def create_message(db: Session, obj_in: MessageCreate) -> Message:
    db_obj = Message(
        conversation_id=obj_in.conversation_id,
        role=obj_in.role,
        content=obj_in.content,
        citations=obj_in.citations
    )
    db.add(db_obj)
    
    # Update conversation updated_at
    conv = db.query(Conversation).get(obj_in.conversation_id)
    if conv:
        from datetime import datetime
        conv.updated_at = datetime.utcnow()
        
    db.commit()
    db.refresh(db_obj)
    return db_obj
