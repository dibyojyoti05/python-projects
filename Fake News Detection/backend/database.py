import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from urllib.parse import urlparse

# Ensure .env is loaded from project root or backend
root_env = Path(__file__).resolve().parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"

if root_env.exists():
    load_dotenv(dotenv_path=root_env)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
else:
    load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:root@127.0.0.1:5433/fake_news_db"
)

def ensure_database_exists(db_url: str):
    """
    Connect to PostgreSQL server default 'postgres' database and 
    create the target database if it doesn't already exist.
    """
    try:
        parsed = urlparse(db_url)
        dbname = parsed.path.lstrip('/') or "fake_news_db"
        user = parsed.username or "postgres"
        password = parsed.password or "root"
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or 5433

        # Connect to maintenance db 'postgres'
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (dbname,))
        exists = cur.fetchone()
        
        if not exists:
            cur.execute(f'CREATE DATABASE "{dbname}";')
            print(f"[Database] Successfully created database '{dbname}'.")
        else:
            print(f"[Database] Target database '{dbname}' already exists.")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[Database Warning] Could not verify/create database automatically: {e}")

# Ensure database exists before creating tables
ensure_database_exists(DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
