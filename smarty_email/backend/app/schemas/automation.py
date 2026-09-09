from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class AutomationRuleBase(BaseModel):
    name: str
    is_active: bool = True
    conditions: Dict[str, Any]
    actions: Dict[str, Any]

class AutomationRuleCreate(AutomationRuleBase):
    pass

class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    conditions: Optional[Dict[str, Any]] = None
    actions: Optional[Dict[str, Any]] = None

class AutomationRuleResponse(AutomationRuleBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
