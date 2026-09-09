from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.application import Application
from app.models.interview import Interview, FollowUp
from app.schemas.interview import InterviewCreate, InterviewUpdate, InterviewResponse, FollowUpCreate, FollowUpUpdate, FollowUpResponse

router_interviews = APIRouter()
router_followups = APIRouter()

# Interviews API
@router_interviews.get("/", response_model=List[InterviewResponse])
def get_interviews(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    return db.query(Interview).join(Application).filter(Application.user_id == current_user.id).all()

@router_interviews.post("/", response_model=InterviewResponse)
def create_interview(inter_in: InterviewCreate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    # Verify application belongs to user
    app = db.query(Application).filter(Application.id == inter_in.application_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    db_inter = Interview(**inter_in.model_dump())
    db.add(db_inter)
    db.commit()
    db.refresh(db_inter)
    return db_inter

@router_interviews.patch("/{inter_id}", response_model=InterviewResponse)
def update_interview(inter_id: int, inter_in: InterviewUpdate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    db_inter = db.query(Interview).join(Application).filter(Interview.id == inter_id, Application.user_id == current_user.id).first()
    if not db_inter:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    for field, value in inter_in.model_dump(exclude_unset=True).items():
        setattr(db_inter, field, value)
    
    db.add(db_inter)
    db.commit()
    db.refresh(db_inter)
    return db_inter


# Follow-ups API
@router_followups.get("/", response_model=List[FollowUpResponse])
def get_followups(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    return db.query(FollowUp).join(Application).filter(Application.user_id == current_user.id).all()

@router_followups.post("/", response_model=FollowUpResponse)
def create_followup(f_in: FollowUpCreate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    app = db.query(Application).filter(Application.id == f_in.application_id, Application.user_id == current_user.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db_f = FollowUp(**f_in.model_dump())
    db.add(db_f)
    db.commit()
    db.refresh(db_f)
    return db_f

@router_followups.patch("/{f_id}", response_model=FollowUpResponse)
def update_followup(f_id: int, f_in: FollowUpUpdate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    db_f = db.query(FollowUp).join(Application).filter(FollowUp.id == f_id, Application.user_id == current_user.id).first()
    if not db_f:
        raise HTTPException(status_code=404, detail="FollowUp not found")
    
    for field, value in f_in.model_dump(exclude_unset=True).items():
        setattr(db_f, field, value)
        
    db.add(db_f)
    db.commit()
    db.refresh(db_f)
    return db_f
