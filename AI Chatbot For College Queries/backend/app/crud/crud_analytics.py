from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.analytics import UnansweredQuestion
from app.schemas.analytics import UnansweredQuestionCreate

def create_unanswered_question(db: Session, obj_in: UnansweredQuestionCreate) -> UnansweredQuestion:
    db_obj = UnansweredQuestion(**obj_in.dict())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def get_unanswered_questions(db: Session, skip: int = 0, limit: int = 100, resolved: Optional[bool] = None) -> List[UnansweredQuestion]:
    query = db.query(UnansweredQuestion)
    if resolved is not None:
        query = query.filter(UnansweredQuestion.resolved == resolved)
    return query.order_by(UnansweredQuestion.created_at.desc()).offset(skip).limit(limit).all()

def mark_resolved(db: Session, id: int) -> Optional[UnansweredQuestion]:
    obj = db.query(UnansweredQuestion).get(id)
    if obj:
        obj.resolved = True
        db.commit()
        db.refresh(obj)
    return obj
