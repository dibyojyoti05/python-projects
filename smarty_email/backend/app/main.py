from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine, Base

# Ensure all models are registered on Base.metadata
from app.models.user import User
from app.models.email import EmailAccount, EmailMessage, EmailAnalysis
from app.models.task import Task
from app.models.automation import AutomationRule

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically create tables on startup if they do not already exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        print(f"[MailMind DB Warning] Automatic table creation skipped or pending connection: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set all CORS enabled origins
if settings.FRONTEND_URL:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

# Include API router
from app.api.api_v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)
