import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine, inspect

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.db.base import Base

def init_postgres_db():
    print(f"Connecting to PostgreSQL at {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT} as {settings.POSTGRES_USER}...")
    
    # 1. Connect to postgres default database to check/create placement_db
    conn = psycopg2.connect(
        host=settings.POSTGRES_SERVER,
        port=settings.POSTGRES_PORT,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        dbname="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (settings.POSTGRES_DB,))
    exists = cursor.fetchone()
    if not exists:
        print(f"Creating database '{settings.POSTGRES_DB}'...")
        cursor.execute(f'CREATE DATABASE "{settings.POSTGRES_DB}";')
        print(f"Database '{settings.POSTGRES_DB}' created successfully!")
    else:
        print(f"Database '{settings.POSTGRES_DB}' already exists.")
        
    cursor.close()
    conn.close()

    # 2. Connect to placement_db and create all tables
    print(f"Connecting to '{settings.POSTGRES_DB}' to create tables...")
    engine = create_engine(settings.SYNC_DATABASE_URI)
    Base.metadata.create_all(bind=engine)
    
    # Inspect tables
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Successfully created tables in {settings.POSTGRES_DB}:")
    for t in sorted(tables):
        print(f"  - {t}")
        
    print("\nDatabase initialization completed 100%!")

if __name__ == "__main__":
    init_postgres_db()
