from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, emails, tasks, search, automation, assistant

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(emails.router, prefix="/emails", tags=["emails"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(automation.router, prefix="/automations", tags=["automations"])
api_router.include_router(assistant.router, prefix="/assistant", tags=["assistant"])
