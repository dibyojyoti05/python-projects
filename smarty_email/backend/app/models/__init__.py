from app.models.base import Base, GUID
from app.models.user import User
from app.models.email import EmailAccount, EmailMessage, EmailAnalysis
from app.models.task import Task
from app.models.automation import AutomationRule

__all__ = [
    "Base",
    "GUID",
    "User",
    "EmailAccount",
    "EmailMessage",
    "EmailAnalysis",
    "Task",
    "AutomationRule",
]
