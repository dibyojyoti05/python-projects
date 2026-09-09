from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, qr_codes, redirect, campaigns, bulk

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(qr_codes.router, prefix="/qr", tags=["qr_codes"])
api_router.include_router(redirect.router, prefix="/r", tags=["redirect"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
api_router.include_router(bulk.router, prefix="/bulk", tags=["bulk"])
