import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

postgres_user = os.getenv("POSTGRES_USER", "postgres")
postgres_password = os.getenv("POSTGRES_PASSWORD", "root")
postgres_server = os.getenv("POSTGRES_SERVER", "127.0.0.1")
postgres_port = os.getenv("POSTGRES_PORT", "5433")
postgres_db = os.getenv("POSTGRES_DB", "resume_matcher")

default_url = f"postgresql://{postgres_user}:{postgres_password}@{postgres_server}:{postgres_port}/{postgres_db}"
SQLALCHEMY_DATABASE_URL = os.getenv("POSTGRES_URL", default_url)

engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

