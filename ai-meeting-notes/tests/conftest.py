import os
import sys
from pathlib import Path
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

# Set environment before any app imports
os.environ["APP_ENV"] = "testing"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["AI_PROVIDER"] = "mock"
os.environ["TRANSCRIPTION_PROVIDER"] = "mock"

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.database.models import Base
import app.database.connection as db_conn

# Use in-memory SQLite engine for tests with expire_on_commit=False
test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestSessionFactory = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
    expire_on_commit=False
)
db_conn.engine = test_engine
db_conn.SessionFactory = TestSessionFactory
db_conn.ScopedSession = scoped_session(TestSessionFactory)


@pytest.fixture(autouse=True)
def setup_test_db():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def sample_transcript() -> str:
    return """[00:00:00] Alice Smith: Welcome everyone to our Sprint 12 Planning session.
[00:00:15] Bob Johnson: I have completed the database migration script for the new billing schema.
[00:00:45] Charlie Brown: I noticed an issue with token expiration. We need to extend the JWT lifetime.
[00:01:10] Alice Smith: We decided to set the JWT token expiration to 24 hours.
[00:01:30] Bob Johnson: I will write the integration tests for the payment gateway by Friday.
[00:02:00] Charlie Brown: I will update the API documentation by tomorrow 3 PM."""

