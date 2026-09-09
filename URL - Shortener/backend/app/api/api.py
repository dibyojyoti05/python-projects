from fastapi import APIRouter
from app.api.endpoints import auth, links, qr, analytics, campaigns, organizations, api_keys, notifications, billing

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(links.router, prefix="/links", tags=["links"])
api_router.include_router(qr.router, prefix="/qr", tags=["qr"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(api_keys.router, prefix="/api-keys", tags=["api_keys"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
