from fastapi import APIRouter
from app.api.v1.endpoints import auth, cameras

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["Cameras"])

@api_router.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "message": "API is healthy"}
