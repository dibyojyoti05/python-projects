from sqlalchemy import Column, String, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship

from app.models.base import BaseModel, GUID

class AutomationRule(BaseModel):
    __tablename__ = "automation_rules"

    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    
    # JSON structure defining the conditions (e.g. {"category": "Client", "priority": "URGENT"})
    conditions = Column(JSON, nullable=False) 
    
    # JSON structure defining the actions (e.g. {"action_type": "CREATE_TASK", "task_title": "Review client request"})
    actions = Column(JSON, nullable=False)

    user = relationship("User", backref="automation_rules")
