# Smart Attendance System

A modern, full-stack facial recognition and QR-code-based smart attendance platform featuring a **Next.js (Turbopack)** frontend, **FastAPI** backend, **OpenCV + LBPH Face Recognition**, and **SQLite/PostgreSQL** database.

---

## 🌟 Key Features

- **Multi-Role Authentication**: Role-Based Access Control (RBAC) with JWT tokens for **Admin**, **Teacher**, and **Student**.
- **Dual Verification Engines**:
  - **OpenCV Face Recognition**: Haarcascade frontal face detection with local LBPH facial feature training and matching.
  - **QR Code Scanning**: High-speed QR token decoding with `pyzbar` and dynamic attendance validation.
- **Teacher Dashboard**: Real-time webcam feed with live scanning overlay, automatic detection processing, and active attendee list.
- **Student Portal**: Dynamic personal QR code generation, historical attendance log, percentage tracker, and performance impact warnings.
- **Admin Management Console**: Overview statistics, manual record creation, inline status modifications, and audit logs.
- **Configured PostgreSQL Database**: Connected directly to your local PostgreSQL server on port `5433` (`attendance_db`) with auto-table generation and pre-seeded mock records.

---

## 🚀 Quick Start (Windows)

Simply double-click:
```cmd
run.bat
```

This starts both:
1. **FastAPI Backend** on `http://localhost:8000` (Interactive docs at `http://localhost:8000/docs`)
2. **Next.js Frontend** on `http://localhost:3000`

---

## 🔑 Default Credentials (Pre-Seeded)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` | Full dashboard access, manual attendance overrides |
| **Teacher** | `teacher@example.com` | `teacher123` | Start live sessions, camera scanner & attendee verification |
| **Student** | `student@example.com` | `student123` | Roll Number: `CS1001`, QR Code generator & stats |

---

## 🛠️ Manual Setup & Execution

### Backend
```cmd
cd backend
.\venv\Scripts\activate.bat
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```cmd
cd frontend
npm install
npm run dev
```

---

## 📁 Architecture

- **`backend/`**:
  - `app/api/routes/`: Authentication, attendance session & record management, user endpoints
  - `app/core/`: Database engine, password hashing, JWT token security
  - `app/cv/engine.py`: OpenCV cascade classifier, LBPH face recognizer, and QR decoder
  - `app/models/domain.py`: SQLAlchemy database models (Users, AttendanceSessions, AttendanceRecords, ClassRooms, Subjects)
  - `seed.py`: Initializer and sample data populator
- **`frontend/`**:
  - `src/app/page.tsx`: Role-aware login portal
  - `src/app/admin/page.tsx`: System administrator management view
  - `src/app/teacher/page.tsx`: Live camera scanner and session runner
  - `src/app/student/page.tsx`: Personal student attendance tracker and QR generator
