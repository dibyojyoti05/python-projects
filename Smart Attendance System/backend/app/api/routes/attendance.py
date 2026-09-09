from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models.domain import AttendanceSession, AttendanceRecord, User
from app.schemas.domain import SessionCreate, SessionResponse, RecordResponse, FramePayload, RecordUpdate, RecordCreateManual, AttendanceStatsResponse
from app.api.dependencies import get_current_user, get_current_teacher, get_current_active_admin
from app.cv.engine import cv_engine

router = APIRouter()

@router.post("/sessions", response_model=SessionResponse)
def create_session(session_in: SessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_teacher)):
    # Check if active session already exists for this subject today
    # (Simplified for brevity)
    new_session = AttendanceSession(
        subject_id=session_in.subject_id,
        teacher_id=current_user.id
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    # Pre-train the engine for this session
    users_with_faces = db.query(User).filter(User.face_encoding.isnot(None)).all()
    cv_engine.train(users_with_faces)
    
    return new_session

@router.get("/sessions", response_model=List[SessionResponse])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == 'teacher':
        return db.query(AttendanceSession).filter(AttendanceSession.teacher_id == current_user.id).all()
    # Admins see all, students shouldn't see this directly
    return db.query(AttendanceSession).all()

@router.post("/sessions/{session_id}/verify")
def verify_frame(session_id: int, payload: FramePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_teacher)):
    # This endpoint receives base64 frames from the frontend React camera
    res = cv_engine.process_base64_frame(payload.image_base64, session_id, db)
    return res

@router.get("/sessions/{session_id}/records", response_model=List[RecordResponse])
def get_session_records(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id).all()

# Admin endpoints
@router.get("/admin/records")
def get_all_records(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    # Returns records with user and session details for the admin table
    records = db.query(AttendanceRecord).all()
    result = []
    for r in records:
        result.append({
            "id": r.id,
            "session_id": r.session_id,
            "student_id": r.student_id,
            "student_name": r.student.name if hasattr(r, 'student') and r.student else (db.query(User).filter(User.id == r.student_id).first().name if db.query(User).filter(User.id == r.student_id).first() else "Unknown"),
            "timestamp": r.timestamp,
            "method": r.method,
            "status": r.status,
            "subject": r.session.subject.name if hasattr(r, 'session') and hasattr(r.session, 'subject') and r.session.subject else "Unknown"
        })
    return result

@router.put("/admin/records/{record_id}", response_model=RecordResponse)
def update_record(record_id: int, payload: RecordUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    record = db.query(AttendanceRecord).filter(AttendanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    record.status = payload.status
    db.commit()
    db.refresh(record)
    return record

@router.post("/admin/records", response_model=RecordResponse)
def create_manual_record(payload: RecordCreateManual, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    record = AttendanceRecord(
        session_id=payload.session_id,
        student_id=payload.student_id,
        status=payload.status,
        method=payload.method
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

# Student endpoints
@router.get("/student/performance/{roll_number}", response_model=AttendanceStatsResponse)
def get_student_performance(roll_number: str, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.roll_number == roll_number).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student with this roll number not found")
    
    records = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).order_by(AttendanceRecord.timestamp.desc()).all()
    
    total = len(records)
    present = len([r for r in records if r.status.lower() == 'present'])
    pct = (present / total * 100) if total > 0 else 0
    
    impact = "Great job maintaining perfect attendance!" if pct > 90 else ("Your attendance is good, keep it up!" if pct > 75 else "Warning: Your attendance is impacting your performance.")
    
    return AttendanceStatsResponse(
        roll_number=student.roll_number or "N/A",
        name=student.name,
        total_sessions=total,
        present_sessions=present,
        attendance_percentage=round(pct, 2),
        impact_message=impact,
        recent_records=records[:5]
    )
