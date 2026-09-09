import time
import datetime
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models.event import DetectionEvent
from app.core.config import settings

def process_notifications():
    print("Notification worker started...", flush=True)
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    last_check = datetime.datetime.utcnow()
    
    while True:
        try:
            with SessionLocal() as db:
                events = db.query(DetectionEvent).filter(DetectionEvent.timestamp > last_check).all()
                for event in events:
                    if event.confidence > 0.7:
                        print(f"[ALERT] High confidence detection: {event.object_class} ({event.confidence*100:.1f}%) on Camera {event.camera_id} at {event.timestamp}", flush=True)
                
                last_check = datetime.datetime.utcnow()
        except Exception as e:
            print(f"Error checking notifications: {e}", flush=True)
            
        time.sleep(10)

if __name__ == "__main__":
    # Add simple delay to allow DB to start
    time.sleep(5)
    process_notifications()
