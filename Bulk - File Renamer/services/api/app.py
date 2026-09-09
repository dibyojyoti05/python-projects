from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import init_db
from services.api.routes.rename import router as rename_router
from services.api.routes.history import router as history_router
from services.api.routes.ai import router as ai_router

def create_app() -> FastAPI:
    """Factory function for FastAPI application."""
    init_db()

    app = FastAPI(
        title="Bulk File Renamer API",
        description="RESTful backend services for intelligent batch file renaming, undo history, and rules engine.",
        version="1.0.0"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/", tags=["Health"])
    @app.get("/health", tags=["Health"])
    def health_check():
        return {
            "status": "healthy",
            "service": "Bulk File Renamer API",
            "version": "1.0.0"
        }

    app.include_router(rename_router)
    app.include_router(history_router)
    app.include_router(ai_router)

    return app

app = create_app()
