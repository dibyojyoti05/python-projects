from fastapi import APIRouter
from app.api.routes import auth, users, conversations, messages, ws, attachments

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(messages.router, prefix="/conversations", tags=["messages"])
api_router.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
api_router.include_router(ws.router, tags=["websocket"])
