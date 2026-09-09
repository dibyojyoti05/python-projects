from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.api import deps
from app.models.user import User
from app.models.application import Application, ApplicationStatusHistory
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse

router = APIRouter()

@router.get("/", response_model=List[ApplicationResponse])
def get_applications(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    return db.query(Application).filter(Application.user_id == current_user.id).all()

@router.post("/", response_model=ApplicationResponse)
def create_application(app_in: ApplicationCreate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    db_app = Application(**app_in.model_dump(), user_id=current_user.id)
    if db_app.status != "Saved":
        db_app.applied_at = datetime.utcnow()
        
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    
    # Record history
    history = ApplicationStatusHistory(application_id=db_app.id, status=db_app.status)
    db.add(history)
    db.commit()
    
    return db_app

@router.patch("/{app_id}", response_model=ApplicationResponse)
def update_application(app_id: int, app_in: ApplicationUpdate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    db_app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    update_data = app_in.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] != db_app.status:
        # Record history if status changed
        history = ApplicationStatusHistory(application_id=db_app.id, status=update_data["status"])
        db.add(history)
        if update_data["status"] == "Applied" and not db_app.applied_at:
            update_data["applied_at"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(db_app, field, value)
        
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.delete("/{app_id}", status_code=204)
def delete_application(app_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    db_app = db.query(Application).filter(Application.id == app_id, Application.user_id == current_user.id).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(db_app)
    db.commit()
    return None
