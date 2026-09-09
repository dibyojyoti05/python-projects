import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base_class import Base
from app.api.deps import get_db, get_current_active_user
from app.models.user import User
import uuid

# Use an in-memory SQLite for testing to avoid touching production PG
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession, expire_on_commit=False)

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(autouse=True)
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def db_session():
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        email="test@example.com",
        is_active=True,
        is_superuser=False
    )

@pytest.fixture
async def async_client(db_session, mock_user):
    db_session.add(mock_user)
    await db_session.commit()

    def override_get_db():
        yield db_session

    def override_get_user():
        return mock_user

    from app.api.deps import get_current_user_or_api_key_user
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_active_user] = override_get_user
    app.dependency_overrides[get_current_user_or_api_key_user] = override_get_user

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


