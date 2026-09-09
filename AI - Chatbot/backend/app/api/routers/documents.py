from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any

from app.api import dependencies
from app.models.user import User
from app.rag.document_processor import process_uploaded_file

router = APIRouter()

@router.post("/upload")
async def upload_document(
    workspace_id: int = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(dependencies.get_db),
    current_user: User = Depends(dependencies.get_current_active_user),
) -> Any:
    """
    Upload a document, chunk it, and store embeddings in the vector database.
    """
    # NOTE: Need to verify if user has access to `workspace_id`
    
    content = await file.read()
    file_id = await process_uploaded_file(
        workspace_id=workspace_id, 
        filename=file.filename, 
        content=content
    )
    
    return {
        "status": "success",
        "file_id": file_id,
        "filename": file.filename,
        "message": "Document processed and stored in vector database."
    }
