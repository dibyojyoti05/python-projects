from app.db.base_class import Base
from app.models.user import User
from app.models.organization import Organization, OrganizationUser, Domain
from app.models.organization import Organization
from app.models.link import Link
from app.models.folder import Folder
from app.models.tag import Tag
from app.models.analytics import ClickEvent
from app.models.api_key import ApiKey
from app.models.notification import Notification
from app.models.subscription import Subscription
from app.models.campaign import Campaign
from app.models.folder import Folder
from app.models.tag import Tag, LinkTag

# Make sure all models are imported before initializing Alembic
