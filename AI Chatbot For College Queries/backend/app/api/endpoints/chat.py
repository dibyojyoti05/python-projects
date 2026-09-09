from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json

from app import schemas, models
from app.api import deps
from app.crud import crud_chat
from app.ai.engine import generate_chat_response

router = APIRouter()

@router.get("/conversations", response_model=List[schemas.chat.Conversation])
def get_conversations(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    return crud_chat.get_user_conversations(db, user_id=current_user.id, skip=skip, limit=limit)

@router.post("/conversations", response_model=schemas.chat.Conversation)
def create_conversation(
    *,
    db: Session = Depends(deps.get_db),
    conv_in: schemas.chat.ConversationCreate,
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    return crud_chat.create_conversation(db, obj_in=conv_in, user_id=current_user.id)

@router.get("/conversations/{conversation_id}/messages", response_model=List[schemas.chat.Message])
def get_messages(
    conversation_id: int,
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    conv = crud_chat.get_conversation(db, id=conversation_id)
    if not conv or conv.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return crud_chat.get_messages(db, conversation_id=conversation_id, skip=skip, limit=limit)

@router.post("/chat")
def chat(
    *,
    db: Session = Depends(deps.get_db),
    chat_in: schemas.chat.ChatRequest,
    current_user: models.user.User = Depends(deps.get_current_user),
) -> Any:
    conversation_id = chat_in.conversation_id
    if not conversation_id:
        # Create new conversation if none provided
        conv = crud_chat.create_conversation(
            db, 
            obj_in=schemas.chat.ConversationCreate(title=chat_in.message[:50]), 
            user_id=current_user.id
        )
        conversation_id = conv.id
    else:
        # Verify ownership
        conv = crud_chat.get_conversation(db, id=conversation_id)
        if not conv or conv.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Conversation not found")

    # We use a StreamingResponse to return the output of the generator
    return StreamingResponse(
        generate_chat_response(db, conversation_id, chat_in.message),
        media_type="text/event-stream"
    )
