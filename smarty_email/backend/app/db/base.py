# Import all models here for Alembic to detect them
from app.db.session import Base
from app.models.base import BaseModel
from app.models.user import User
from app.models.email import EmailAccount, EmailMessage, EmailAnalysis
from app.models.task import Task
from app.models.automation import AutomationRule
