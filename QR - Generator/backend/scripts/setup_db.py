import asyncio
import asyncpg
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

async def check_and_create_db():
    conn_str = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}/postgres"
    conn = await asyncpg.connect(conn_str)
    try:
        exists = await conn.fetchval(f"SELECT 1 FROM pg_database WHERE datname = '{settings.POSTGRES_DB}'")
        if not exists:
            await conn.execute(f"CREATE DATABASE {settings.POSTGRES_DB}")
            print(f"Database '{settings.POSTGRES_DB}' created successfully!")
        else:
            print(f"Database '{settings.POSTGRES_DB}' already exists.")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(check_and_create_db())
