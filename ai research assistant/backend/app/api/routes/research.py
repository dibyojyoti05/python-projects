import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.schemas.research import ResearchRequest, ResearchResponse, ResearchStatusResponse, HistoryResponse, PlanRequest, PlanResponse
from app.database.database import get_db
from app.models.research import ResearchSessionDB
from app.services.research_service import ResearchService
from app.services.planner_service import ResearchPlannerService
import uuid
import logging
from typing import List

logger = logging.getLogger(__name__)
router = APIRouter()
research_service = ResearchService()
planner_service = ResearchPlannerService()

def update_db_status(db: Session, session_id: str, status: str, report_json=None, sources_json=None):
    db_session = db.query(ResearchSessionDB).filter(ResearchSessionDB.id == session_id).first()
    if db_session:
        db_session.status = status
        if report_json:
            db_session.report_json = report_json
        if sources_json:
            db_session.sources_json = sources_json
        db.commit()

async def process_research_task(session_id: str, query: str, plan_dict: dict):
    """
    Background task that runs the RAG pipeline and updates the database.
    """
    # Need a fresh DB session for the background thread
    from app.database.database import SessionLocal
    db = SessionLocal()
    
    try:
        def update_status_cb(sid, status):
            update_db_status(db, sid, status)
            
        result = await research_service.run_research(session_id, query, plan_dict, update_status_cb)
        
        if "error" in result:
            logger.error(f"Research error: {result['error']}")
            update_db_status(db, session_id, "failed")
        else:
            update_db_status(db, session_id, "completed", result.get("report"), result.get("sources_used"))
            
    except Exception as e:
        logger.error(f"Unhandled exception in background task: {e}")
        update_db_status(db, session_id, "failed")
    finally:
        db.close()

@router.post("/plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
    try:
        plan = await asyncio.to_thread(planner_service.generate_plan, request.query)
        return PlanResponse(plan=plan)
    except Exception as e:
        logger.error(f"Error generating plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate research plan.")

@router.post("/", response_model=ResearchResponse)
async def start_research(request: ResearchRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Search query cannot be empty.")
    
    session_id = str(uuid.uuid4())
    
    # Create DB record
    db_session = ResearchSessionDB(id=session_id, query=request.query, status="queued")
    db.add(db_session)
    db.commit()
    
    background_tasks.add_task(process_research_task, session_id, request.query, request.plan.model_dump())
    
    return ResearchResponse(
        research_id=session_id,
        status="queued",
        message="Research job started successfully."
    )

@router.get("/history", response_model=List[HistoryResponse])
@router.get("/history/", response_model=List[HistoryResponse])
async def get_history(db: Session = Depends(get_db)):
    sessions = db.query(ResearchSessionDB).order_by(ResearchSessionDB.created_at.desc()).all()
    return [
        HistoryResponse(
            research_id=s.id,
            query=s.query,
            status=s.status,
            created_at=s.created_at
        ) for s in sessions
    ]

@router.get("/{research_id}", response_model=ResearchStatusResponse)
async def get_research_status(research_id: str, db: Session = Depends(get_db)):
    db_session = db.query(ResearchSessionDB).filter(ResearchSessionDB.id == research_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Research ID not found.")
    
    return ResearchStatusResponse(
        research_id=db_session.id,
        status=db_session.status,
        query=db_session.query,
        report=db_session.report_json,
        sources=db_session.sources_json
    )
