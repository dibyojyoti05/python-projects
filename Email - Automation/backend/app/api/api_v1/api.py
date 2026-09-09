from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, contacts, campaigns, providers, workflows, dashboard, media

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(providers.router, prefix="/providers", tags=["providers"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
