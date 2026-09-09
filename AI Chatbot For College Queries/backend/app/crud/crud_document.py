from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.document import Document
from app.schemas.document import DocumentCreate

def get(db: Session, id: int) -> Optional[Document]:
    return db.query(Document).filter(Document.id == id).first()

def get_multi(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
    return db.query(Document).offset(skip).limit(limit).all()

def create(db: Session, *, obj_in: DocumentCreate, s3_key: str, uploaded_by: int) -> Document:
    db_obj = Document(
        title=obj_in.title,
        description=obj_in.description,
        category=obj_in.category,
        department_id=obj_in.department_id,
        effective_date=obj_in.effective_date,
        s3_key=s3_key,
        uploaded_by=uploaded_by,
        status="UPLOADED"
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def remove(db: Session, *, id: int) -> Document:
    obj = db.query(Document).get(id)
    if obj:
        db.delete(obj)
        db.commit()
    return obj
