from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import asyncio
from app.api.api_v1.api import api_router
from app.workers.monitoring_worker import collect_and_broadcast

app = FastAPI(
    title="NetworkPulse API",
    description="Real-Time Network Monitoring & Analytics Platform",
    version="1.0.0",
)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(collect_and_broadcast())

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "NetworkPulse API is running"}

app.include_router(api_router, prefix="/api/v1")
