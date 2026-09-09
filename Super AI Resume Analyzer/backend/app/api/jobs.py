import json
import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.job import Job, JobEmbedding
from app.models.resume import Resume
from app.models.match import MatchResult, Recommendation
from app.schemas.job import JobCreate, JobResponse
from app.schemas.match import DirectMatchResponse
from app.services.nlp.parser import ResumeParser
from app.services.embeddings.model import EmbeddingModel
from app.services.matching.engine import MatchingEngine

router = APIRouter()

@router.post("/", response_model=JobResponse)
def create_job(job_in: JobCreate, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    extracted_skills = ResumeParser.extract_skills(job_in.description)
    exp_match = re.search(r'(\d+)\+?\s*(?:years?|yrs?)', job_in.description, re.I)
    exp_str = f"{exp_match.group(1)}+ years" if exp_match else "1-3 years"

    req_skills = extracted_skills[:6] if len(extracted_skills) >= 6 else extracted_skills
    pref_skills = extracted_skills[6:12] if len(extracted_skills) > 6 else []

    extracted_reqs = json.dumps({
        "required_skills": req_skills,
        "preferred_skills": pref_skills,
        "experience": exp_str
    })
    
    db_job = Job(
        title=job_in.title,
        company=job_in.company,
        description=job_in.description,
        user_id=current_user.id,
        requirements_extracted=extracted_reqs
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)

    # Compute and store job embedding
    try:
        emb_vector = EmbeddingModel.get_embedding(job_in.description[:2000])
        db_emb = JobEmbedding(
            job_id=db_job.id,
            embedding=emb_vector,
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        )
        db.add(db_emb)
        db.commit()
    except Exception:
        pass

    return db_job

@router.get("/", response_model=List[JobResponse])
def get_jobs(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    return db.query(Job).filter(Job.user_id == current_user.id).order_by(Job.created_at.desc()).all()

@router.post("/{job_id}/match/{resume_id}", response_model=DirectMatchResponse)
def match_job_with_resume(
    job_id: int,
    resume_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()

    if not job or not resume:
        raise HTTPException(status_code=404, detail="Job description or Resume not found")

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

    for rec_text in scores["recommendations"]:
        rec = Recommendation(
            match_result_id=match.id,
            rec_type="gap",
            content=rec_text
        )
        db.add(rec)

    db.commit()
    db.refresh(match)

    return DirectMatchResponse(
        id=match.id,
        job_id=job.id,
        job_description_id=job.id,
        resume_id=resume.id,
        match_score=int(scores["overall_score"]),
        overall_score=scores["overall_score"],
        skill_score=scores["skill_score"],
        semantic_score=scores["semantic_score"],
        experience_score=scores["experience_score"],
        matched_skills=scores["matched_skills"],
        missing_skills=scores["missing_skills"],
        recommendations=scores["recommendations"]
    )
