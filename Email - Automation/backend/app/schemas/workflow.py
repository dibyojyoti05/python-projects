import uuid
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from app.models.workflow import WorkflowStatus

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    status: WorkflowStatus = WorkflowStatus.DRAFT

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    status: Optional[WorkflowStatus] = None

class WorkflowInDBBase(WorkflowBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

class Workflow(WorkflowInDBBase):
    pass

class WorkflowTestRequest(BaseModel):
    contact_email: Optional[str] = "test@example.com"
    contact_attributes: Optional[Dict[str, Any]] = None

class WorkflowTestResponse(BaseModel):
    success: bool
    steps_count: int
    steps: List[Dict[str, Any]]
    error: Optional[str] = None
