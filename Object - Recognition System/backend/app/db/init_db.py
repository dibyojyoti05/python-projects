from sqlalchemy.orm import Session
from app.db.seed import seed_database

def init_db(db: Session) -> None:
    # Ensure database is properly initialized and seeded
    seed_database()
