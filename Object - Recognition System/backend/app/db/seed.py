import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db.models.user import User
from app.db.models.camera import Camera
from app.db.models.event import DetectionEvent
from app.core.security import get_password_hash

def seed_database():
    db: Session = SessionLocal()
    try:
        print("Starting database seeding on PostgreSQL 5433...")

        # 1. Seed Users
        users_data = [
            {"email": "admin@example.com", "password": "admin123", "full_name": "System Administrator", "role": "admin"},
            {"email": "operator@example.com", "password": "operator123", "full_name": "Security Operator", "role": "operator"},
            {"email": "viewer@example.com", "password": "viewer123", "full_name": "Audit Viewer", "role": "viewer"},
        ]
        
        for u in users_data:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                user = User(
                    email=u["email"],
                    hashed_password=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    is_active=True
                )
                db.add(user)
                print(f"Created user: {u['email']} ({u['role']})")
        db.commit()

        # 2. Seed Cameras
        cameras_data = [
            {
                "id": 1,
                "name": "Main Entrance Lobby",
                "location": "Building A - Ground Floor",
                "rtsp_url": "0",
                "ai_enabled": True,
                "is_active": True,
                "is_connected": True
            },
            {
                "id": 2,
                "name": "North Perimeter Gate",
                "location": "Gate 1 - Vehicle Entry",
                "rtsp_url": "rtsp://192.168.1.102:554/live",
                "ai_enabled": True,
                "is_active": True,
                "is_connected": True
            },
            {
                "id": 3,
                "name": "Server Room Corridor",
                "location": "Data Center - Floor B1",
                "rtsp_url": "rtsp://192.168.1.103:554/live",
                "ai_enabled": True,
                "is_active": True,
                "is_connected": False
            },
            {
                "id": 4,
                "name": "Logistics Loading Dock",
                "location": "Warehouse Bay 4",
                "rtsp_url": "rtsp://192.168.1.104:554/live",
                "ai_enabled": True,
                "is_active": True,
                "is_connected": True
            }
        ]

        created_cams = []
        for c in cameras_data:
            cam = db.query(Camera).filter(Camera.name == c["name"]).first()
            if not cam:
                cam = Camera(
                    name=c["name"],
                    location=c["location"],
                    rtsp_url=c["rtsp_url"],
                    ai_enabled=c["ai_enabled"],
                    is_active=c["is_active"],
                    is_connected=c["is_connected"]
                )
                db.add(cam)
                db.flush()
                print(f"Created camera: {c['name']} (ID: {cam.id})")
            created_cams.append(cam)
        db.commit()

        # 3. Seed Events (150 realistic detection events over past 24h)
        existing_event_count = db.query(DetectionEvent).count()
        if existing_event_count < 50:
            print("Generating realistic historical detection events...")
            object_classes = [
                ("person", 0.40),
                ("car", 0.25),
                ("backpack", 0.12),
                ("truck", 0.08),
                ("laptop", 0.08),
                ("cell phone", 0.07)
            ]
            classes, weights = zip(*object_classes)

            now = datetime.utcnow()
            events = []

            for i in range(150):
                # Spread timestamps over the last 24 hours
                hours_ago = random.uniform(0.1, 24.0)
                event_time = now - timedelta(hours=hours_ago)
                
                # Pick camera
                cam = random.choice(created_cams)
                obj_class = random.choices(classes, weights=weights)[0]
                confidence = round(random.uniform(0.72, 0.99), 2)
                
                # Coords
                x1 = random.randint(50, 400)
                y1 = random.randint(50, 300)
                x2 = x1 + random.randint(60, 250)
                y2 = y1 + random.randint(60, 250)
                
                track_id = f"TRK-{random.randint(100, 999)}"
                zone_name = "Restricted Zone" if cam.name == "Server Room Corridor" else "General Monitored Area"

                event = DetectionEvent(
                    camera_id=cam.id,
                    object_class=obj_class,
                    confidence=confidence,
                    tracking_id=track_id,
                    bounding_box=f"{x1},{y1},{x2},{y2}",
                    zone_name=zone_name,
                    duration_seconds=round(random.uniform(1.5, 30.0), 1),
                    timestamp=event_time
                )
                events.append(event)

            db.add_all(events)
            db.commit()
            print(f"Successfully seeded {len(events)} detection events!")
        else:
            print(f"Events already exist ({existing_event_count} events found).")

        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
