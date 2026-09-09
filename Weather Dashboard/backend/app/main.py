from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.session import engine
from app.models import Base
from app.api import weather, geocoding, ai, favorites, alerts

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Warning: Database initialization error: {e}")
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="Weather Intelligence Platform API",
    description="Full-featured Backend API with PostgreSQL persistence and Gemini AI",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather.router)
app.include_router(geocoding.router)
app.include_router(ai.router)
app.include_router(favorites.router)
app.include_router(alerts.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Weather Intelligence Platform Backend is running."}
