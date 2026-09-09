from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.api_v1.api import api_router
from app.api.api_v1.endpoints import redirect

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API V1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

# Mount direct short-code redirect at root (/r/{short_code})
app.include_router(redirect.router, prefix="/r", tags=["redirect"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Enterprise QR Platform API",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
