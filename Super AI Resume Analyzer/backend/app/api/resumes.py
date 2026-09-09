import os
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.resume import Resume, ResumeEmbedding
from app.models.analysis import Analysis
from app.schemas.resume import ResumeResponse, ResumeAnalysisResponse, ResumeReportResponse
from app.services.documents.extractor import DocumentExtractor
from app.services.nlp.parser import ResumeParser
from app.services.embeddings.model import EmbeddingModel

router = APIRouter()

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def _save_and_parse_resume(file: UploadFile, title: Optional[str], db: Session, current_user: User) -> Resume:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a filename.")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.pdf', '.docx', '.txt']:
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF, DOCX, or TXT file.")
    
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        parsed_text = DocumentExtractor.extract_text(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {e}")

    effective_title = title if title and title.strip() else os.path.splitext(file.filename)[0]
    
    db_resume = Resume(
        user_id=current_user.id,
        filename=file.filename,
        file_path=file_path,
        parsed_text=parsed_text,
        title=effective_title,
        target_role=effective_title,
        version=1
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    # Compute and store embedding
    try:
        emb_vector = EmbeddingModel.get_embedding(parsed_text[:2000])
        db_emb = ResumeEmbedding(
            resume_id=db_resume.id,
            embedding=emb_vector,
            model_version="sentence-transformers/all-MiniLM-L6-v2"
        )
        db.add(db_emb)
    except Exception:
        pass

    # Compute and store initial ATS analysis
    try:
        report = ResumeParser.generate_report(parsed_text)
        db_analysis = Analysis(
            resume_id=db_resume.id,
            overall_score=report["overall_score"],
            ats_score=report["ats_score"],
            component_scores=report["component_scores"],
            strengths=report["strengths"],
            weaknesses=report["weaknesses"],
            suggestions=report["suggestions"]
        )
        db.add(db_analysis)
    except Exception:
        pass

    db.commit()
    db.refresh(db_resume)
    return db_resume

@router.post("/", response_model=ResumeResponse)
def upload_resume_root(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return _save_and_parse_resume(file, title, db, current_user)

@router.post("/upload", response_model=ResumeResponse)
def upload_resume(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return _save_and_parse_resume(file, title, db, current_user)

@router.get("/", response_model=List[ResumeResponse])
def get_resumes(db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    # Ensure title is populated
    for r in resumes:
        if not r.title:
            r.title = os.path.splitext(r.filename)[0]
    return resumes

@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume_by_id(resume_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.title:
        resume.title = os.path.splitext(resume.filename)[0]
    return resume

@router.get("/{resume_id}/analysis", response_model=ResumeAnalysisResponse)
def analyze_resume(resume_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeParser.analyze(resume.parsed_text or "")

@router.get("/{resume_id}/report", response_model=ResumeReportResponse)
def get_resume_report(resume_id: int, db: Session = Depends(deps.get_db), current_user: User = Depends(deps.get_current_user)):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    analysis_record = db.query(Analysis).filter(Analysis.resume_id == resume.id).order_by(Analysis.created_at.desc()).first()
    if analysis_record:
        report_data = {
            "overall_score": analysis_record.overall_score,
            "ats_score": analysis_record.ats_score,
            "component_scores": analysis_record.component_scores or {},
            "strengths": analysis_record.strengths or [],
            "weaknesses": analysis_record.weaknesses or [],
            "suggestions": analysis_record.suggestions or []
        }
    else:
        report_data = ResumeParser.generate_report(resume.parsed_text or "")
        # Cache in DB
        db_analysis = Analysis(
            resume_id=resume.id,
            overall_score=report_data["overall_score"],
            ats_score=report_data["ats_score"],
            component_scores=report_data["component_scores"],
            strengths=report_data["strengths"],
            weaknesses=report_data["weaknesses"],
            suggestions=report_data["suggestions"]
        )
        db.add(db_analysis)
        db.commit()

    return {
        "version_id": resume.id,
        "analysis": report_data
    }
