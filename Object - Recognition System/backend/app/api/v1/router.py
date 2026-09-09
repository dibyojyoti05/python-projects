from fastapi import APIRouter
from app.api.v1 import auth, cameras, streams, events, system

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(cameras.router, prefix="/cameras", tags=["cameras"])
api_router.include_router(streams.router, prefix="/streams", tags=["streams"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(system.router, prefix="/system", tags=["system"])
