from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Enterprise AI Vision Platform API",
    version="1.0.0"
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

from app.db.base_class import Base
from app.db.session import engine
from app.db.models import user, camera, event
from app.db.init_db import init_db
from sqlalchemy.orm import Session

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    with Session(engine) as db:
        init_db(db)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "Welcome to Enterprise AI Vision Platform API"}
