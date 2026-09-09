from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.resume import Resume
from app.models.job import Job
from app.models.match import MatchResult
from app.models.analysis import Analysis
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/analyses")
def get_analysis_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    analyses = (
        db.query(Analysis)
        .join(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(Analysis.created_at.desc())
        .all()
    )
    results = []
    for a in analyses:
        results.append({
            "id": a.id,
            "resume_id": a.resume_id,
            "overall_score": a.overall_score,
            "ats_score": a.ats_score,
            "component_scores": a.component_scores,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return results

@router.get("/job-matches")
def get_job_match_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> List[Dict[str, Any]]:
    matches = (
        db.query(MatchResult)
        .join(Resume)
        .filter(Resume.user_id == current_user.id)
        .order_by(MatchResult.created_at.desc())
        .all()
    )
    results = []
    for m in matches:
        results.append({
            "id": m.id,
            "job_id": m.job_id,
            "job_description_id": m.job_id,
            "resume_id": m.resume_id,
            "match_score": int(m.overall_score),
            "overall_score": m.overall_score,
            "skill_score": m.skill_score,
            "semantic_score": m.semantic_score,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })
    return results

@router.get("/compare/{version_a_id}/{version_b_id}")
def compare_versions(version_a_id: int, version_b_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    va = db.query(Resume).filter(Resume.id == version_a_id, Resume.user_id == current_user.id).first()
    vb = db.query(Resume).filter(Resume.id == version_b_id, Resume.user_id == current_user.id).first()
    
    if not va or not vb:
        raise HTTPException(status_code=404, detail="One or both resume versions not found")
        
    a_analysis = db.query(Analysis).filter(Analysis.resume_id == va.id).order_by(Analysis.created_at.desc()).first()
    b_analysis = db.query(Analysis).filter(Analysis.resume_id == vb.id).order_by(Analysis.created_at.desc()).first()
    
    a_score = a_analysis.overall_score if a_analysis else 0
    a_ats = a_analysis.ats_score if a_analysis else 0
    b_score = b_analysis.overall_score if b_analysis else 0
    b_ats = b_analysis.ats_score if b_analysis else 0
    
    return {
        "version_a": {
            "score": a_score,
            "ats_score": a_ats
        },
        "version_b": {
            "score": b_score,
            "ats_score": b_ats
        },
        "score_diff": b_score - a_score
    }
