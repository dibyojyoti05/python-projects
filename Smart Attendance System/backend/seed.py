import os
import sys

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine, Base, SessionLocal
from app.models.domain import User, ClassRoom, Subject, student_class
from app.core.security import get_password_hash

def seed_db():
    print("Creating tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("Seeding Users...")
        # Create Admin
        admin = User(
            name="Admin User",
            email="admin@example.com",
            password_hash=get_password_hash("admin123"),
            role="admin"
        )
        
        # Create Teacher
        teacher = User(
            name="John Doe",
            email="teacher@example.com",
            password_hash=get_password_hash("teacher123"),
            role="teacher"
        )
        
        # Create Student
        student = User(
            name="Jane Smith",
            email="student@example.com",
            password_hash=get_password_hash("student123"),
            role="student",
            roll_number="CS1001",
            qr_code_data="student-jane-secret-qr-token"
        )

        db.add_all([admin, teacher, student])
        db.commit()
        db.refresh(teacher)
        db.refresh(student)

        print("Seeding Classes and Subjects...")
        class_room = ClassRoom(name="Grade 10-A")
        class_room.students.append(student)
        db.add(class_room)
        db.commit()
        db.refresh(class_room)

        subject = Subject(name="Mathematics", class_id=class_room.id, teacher_id=teacher.id)
        db.add(subject)
        db.commit()

        print("Database seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
