from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class WorkspaceBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(WorkspaceBase):
    name: Optional[str] = None

class WorkspaceInDBBase(WorkspaceBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class Workspace(WorkspaceInDBBase):
    pass
