# Import all the models, so that Base has them before being imported by Alembic
from app.db.base_class import Base  # noqa
from app.models.user import User  # noqa
from app.models.organization import Organization, OrganizationMember  # noqa
from app.models.campaign import Campaign  # noqa
from app.models.qr_code import QRCode  # noqa
from app.models.scan import Scan  # noqa
