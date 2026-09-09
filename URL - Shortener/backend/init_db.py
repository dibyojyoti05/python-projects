import asyncio
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy.ext.asyncio import create_async_engine
from app.db.base_class import Base
import app.models  # load all models
from app.core.config import settings

def ensure_database_exists():
    host = settings.POSTGRES_SERVER
    port = int(settings.POSTGRES_PORT)
    user = settings.POSTGRES_USER
    password = settings.POSTGRES_PASSWORD
    target_db = settings.POSTGRES_DB

    print(f"Connecting to PostgreSQL server at {host}:{port} as {user}...")
    conn = psycopg2.connect(
        dbname="postgres",
        user=user,
        password=password,
        host=host,
        port=port
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (target_db,))
    exists = cur.fetchone()
    if not exists:
        print(f"Creating database '{target_db}'...")
        cur.execute(f'CREATE DATABASE "{target_db}";')
        print(f"Database '{target_db}' created successfully.")
    else:
        print(f"Database '{target_db}' already exists.")
        
    cur.close()
    conn.close()

async def init_tables():
    db_uri = str(settings.SQLALCHEMY_DATABASE_URI)
    print(f"Initializing tables on {db_uri}...")
    engine = create_async_engine(db_uri, echo=False)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    await engine.dispose()
    print("All database tables created successfully!")

if __name__ == "__main__":
    ensure_database_exists()
    asyncio.run(init_tables())
