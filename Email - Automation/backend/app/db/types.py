from sqlalchemy import JSON, Uuid
from sqlalchemy.dialects.postgresql import JSONB, UUID

# Universal types that compile to native JSONB/UUID on PostgreSQL and JSON/CHAR on SQLite
JSONType = JSON().with_variant(JSONB(), "postgresql")
UUIDType = Uuid(as_uuid=True).with_variant(UUID(as_uuid=True), "postgresql")
