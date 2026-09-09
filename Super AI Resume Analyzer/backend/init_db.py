import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

load_dotenv()

postgres_user = os.getenv("POSTGRES_USER", "postgres")
postgres_password = os.getenv("POSTGRES_PASSWORD", "root")
postgres_server = os.getenv("POSTGRES_SERVER", "127.0.0.1")
postgres_port = os.getenv("POSTGRES_PORT", "5433")
postgres_db = os.getenv("POSTGRES_DB", "resume_matcher")

def init_database():
    print(f"Connecting to PostgreSQL server at {postgres_server}:{postgres_port}...")
    try:
        # Step 1: Ensure database exists
        conn = psycopg2.connect(
            host=postgres_server,
            port=postgres_port,
            user=postgres_user,
            password=postgres_password,
            dbname="postgres"
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        cur.execute("SELECT 1 FROM pg_database WHERE datname = %s;", (postgres_db,))
        exists = cur.fetchone()
        if not exists:
            print(f"Database '{postgres_db}' does not exist. Creating...")
            cur.execute(f'CREATE DATABASE "{postgres_db}";')
            print(f"Database '{postgres_db}' created successfully.")
        else:
            print(f"Database '{postgres_db}' already exists.")
            
        cur.close()
        conn.close()
        
        # Step 2: Create all tables via SQLAlchemy models
        from app.db.session import engine
        from app.models.base import Base
        
        print("Creating all tables in database...")
        Base.metadata.create_all(bind=engine)
        print("All tables successfully initialized!")
        return True
    except Exception as e:
        print(f"Failed to initialize database: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    success = init_database()
    if not success:
        sys.exit(1)
