from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import ollama

from app.api.routes import research
from app.config import get_settings
from app.database.database import engine, Base

import app.models.research # Ensure models are loaded into Base metadata
# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Research Assistant API",
    description="Backend API for the AI Research Assistant",
    version="0.1.0"
)

settings = get_settings()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router, prefix="/api/research", tags=["Research"])

@app.get("/api/health")
async def health_check():
    """Basic health check endpoint"""
    return {"status": "ok", "message": "AI Research Assistant API is running"}

@app.get("/api/health/ai")
async def health_check_ai():
    """Health check for local AI services"""
    status = {
        "ollama": "disconnected",
        "llm": settings.ollama_llm_model,
        "llm_available": False,
        "embedding_model": settings.ollama_embed_model,
        "embedding_available": False
    }
    
    try:
        client = ollama.Client(host=settings.ollama_host)
        # Check if ollama is reachable by listing models
        models_response = client.list()
        status["ollama"] = "connected"
        
        models = [m.get("model", "") for m in models_response.get("models", [])]
        
        # Check model availability
        for m in models:
            if m == settings.ollama_llm_model or m.startswith(settings.ollama_llm_model):
                status["llm_available"] = True
            if m == settings.ollama_embed_model or m.startswith(settings.ollama_embed_model):
                status["embedding_available"] = True
                
    except Exception as e:
        status["error"] = str(e)
        
    return status
