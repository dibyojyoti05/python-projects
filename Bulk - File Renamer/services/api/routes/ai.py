from fastapi import APIRouter
from services.ai_service.client import AIRenameAssistant
from services.api.schemas import AISuggestRequest, AISuggestResponse

router = APIRouter(prefix="/api/ai", tags=["AI Assistance"])
assistant = AIRenameAssistant()

@router.post("/suggest", response_model=AISuggestResponse)
def suggest_names(payload: AISuggestRequest):
    """Generates intelligent name suggestions from a natural language prompt."""
    suggestions = assistant.suggest_names(payload.files, context=payload.prompt)
    return AISuggestResponse(suggestions=suggestions)
