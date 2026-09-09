import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.resume import Resume
from app.models.job import Job
from app.models.match import MatchResult, Recommendation
from app.schemas.match import MatchResultResponse
from app.services.matching.engine import MatchingEngine

router = APIRouter()

@router.post("/", response_model=MatchResultResponse)
def analyze_match(resume_id: int, job_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    
    if not resume or not job:
        raise HTTPException(status_code=404, detail="Resume or Job not found")
        
    scores = MatchingEngine.calculate_match(resume, job)
    
    match = MatchResult(
        resume_id=resume.id,
        job_id=job.id,
        overall_score=scores["overall_score"],
        skill_score=scores["skill_score"],
        semantic_score=scores["semantic_score"],
        experience_score=scores["experience_score"],
        analysis_details=json.dumps({
            "matched_skills": scores["matched_skills"],
            "missing_skills": scores["missing_skills"],
            "recommendations": scores["recommendations"]
        })
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    
    for rec_content in scores["recommendations"]:
        rec = Recommendation(
            match_result_id=match.id,
            rec_type="gap",
            content=rec_content
        )
        db.add(rec)
    
    db.commit()
    db.refresh(match)
    
    return match

@router.get("/", response_model=List[MatchResultResponse])
def get_matches(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    matches = (
        db.query(MatchResult)
        .join(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(MatchResult.created_at.desc())
        .all()
    )
    return matches
