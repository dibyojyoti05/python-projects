from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.job import Job, SavedJob
from app.schemas.job import JobResponse, SavedJobResponse

router = APIRouter()

@router.get("/", response_model=List[JobResponse])
def get_jobs(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    keyword: Optional[str] = None,
    location: Optional[str] = None,
    remote_type: Optional[str] = None,
):
    query = db.query(Job)
    if keyword:
        query = query.filter(Job.title.ilike(f"%{keyword}%") | Job.company.ilike(f"%{keyword}%") | Job.description.ilike(f"%{keyword}%"))
    if location:
        query = query.filter(Job.location.ilike(f"%{location}%"))
    if remote_type:
        query = query.filter(Job.remote_type.ilike(f"%{remote_type}%"))
    
    jobs = query.order_by(Job.posted_at.desc().nullslast()).offset(skip).limit(limit).all()
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(deps.get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/{job_id}/save", response_model=SavedJobResponse)
def save_job(job_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    existing_saved = db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id).first()
    if existing_saved:
        raise HTTPException(status_code=400, detail="Job already saved")
    
    saved_job = SavedJob(user_id=current_user.id, job_id=job_id)
    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)
    return saved_job

@router.delete("/{job_id}/save", status_code=204)
def unsave_job(job_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    saved_job = db.query(SavedJob).filter(SavedJob.user_id == current_user.id, SavedJob.job_id == job_id).first()
    if not saved_job:
        raise HTTPException(status_code=404, detail="Saved job not found")
    
    db.delete(saved_job)
    db.commit()
    return None
