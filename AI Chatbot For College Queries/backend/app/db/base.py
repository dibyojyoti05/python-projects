# Import all the models, so that Base has them before being
# imported by Alembic
from sqlalchemy.orm import declarative_base

Base = declarative_base()

from app.models.user import User  # noqa
from app.models.user import User  # noqa
from app.models.college import Department, Course, Notice, FAQ  # noqa
from app.models.document import Document # noqa
from app.models.document_chunk import DocumentChunk # noqa
from app.models.chat import Conversation, Message # noqa
from app.models.analytics import UnansweredQuestion # noqa
