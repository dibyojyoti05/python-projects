from fastapi import APIRouter

api_router = APIRouter()

from app.api.endpoints import login, users, college, documents, chat, analytics

api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(college.router, prefix="/college", tags=["college"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])



