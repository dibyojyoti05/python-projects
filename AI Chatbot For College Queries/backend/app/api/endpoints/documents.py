from typing import Any, List
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import json

from app import schemas, models
from app.api import deps
from app.crud import crud_document
from app.core import storage
from app.rag import processor

router = APIRouter()

@router.post("/", response_model=schemas.document.Document)
def upload_document(
    *,
    db: Session = Depends(deps.get_db),
    title: str = Form(...),
    description: str = Form(None),
    category: str = Form(None),
    department_id: int = Form(None),
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks,
    current_user: models.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN", "STAFF"])),
) -> Any:
    # 1. Upload file to MinIO
    try:
        s3_key = storage.upload_file(file.file, file.filename, file.content_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")
    
    # 2. Save metadata in DB
    doc_in = schemas.document.DocumentCreate(
        title=title,
        description=description,
        category=category,
        department_id=department_id,
    )
    document = crud_document.create(
        db, obj_in=doc_in, s3_key=s3_key, uploaded_by=current_user.id
    )
    
    # 3. Trigger background worker to process and index document
    background_tasks.add_task(processor.process_document, deps.SessionLocal(), document.id)
    
    return document

@router.get("/", response_model=List[schemas.document.DocumentResponse])
def get_documents(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    docs = crud_document.get_multi(db, skip=skip, limit=limit)
    res = []
    for d in docs:
        d_dict = d.__dict__
        try:
            d_dict['url'] = storage.get_file_url(d.s3_key)
        except Exception:
            d_dict['url'] = None
        res.append(d_dict)
    return res

@router.delete("/{id}", response_model=schemas.document.Document)
def delete_document(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user: models.user.User = Depends(deps.require_roles(["ADMIN", "SUPER_ADMIN"])),
) -> Any:
    document = crud_document.get(db, id=id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete from MinIO
    try:
        storage.delete_file(document.s3_key)
    except Exception:
        pass # Handle silently or log error
    
    # Delete from DB
    document = crud_document.remove(db, id=id)
    return document
