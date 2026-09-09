from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.schemas.analytics import UnansweredQuestion
from app.api import deps
from app.crud import crud_analytics

router = APIRouter()

@router.get("/unanswered", response_model=List[UnansweredQuestion])
def get_unanswered_questions(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    resolved: Optional[bool] = None,
    current_user: models.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN", "STAFF"])),
) -> Any:
    return crud_analytics.get_unanswered_questions(db, skip=skip, limit=limit, resolved=resolved)

@router.put("/unanswered/{id}/resolve", response_model=UnansweredQuestion)
def resolve_question(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN", "STAFF"])),
) -> Any:
    return crud_analytics.mark_resolved(db, id=id)
