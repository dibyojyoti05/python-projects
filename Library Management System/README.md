# Library Management & Digital Lending Platform

A production-grade, multi-branch library management system.

## Tech Stack
- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: FastAPI (Python 3.11), SQLAlchemy, Alembic
- **Database**: PostgreSQL
- **Cache/Queue**: Redis & Celery
- **Deployment**: Docker & Docker Compose

## Features Implemented (Phases 1-16)
1. **Architecture**: Scalable async backend with FastAPI and robust Next.js frontend.
2. **Authentication/RBAC**: JWT based auth, multi-role (Admin, Librarian, Assistant, Member, Viewer).
3. **Book Management**: Full catalog models (Books, Authors, Publishers, Categories, Physical Copies).
4. **Member Management**: Membership types, borrowing limits.
5. **Circulation**: Issuing, returning, loan status tracking, concurrent access prevention.
6. **Financials**: Fine calculations, reservation queues, partial/full payments.
7. **Peripherals**: Barcode/QR generation endpoints for physical copies and members.
8. **Background Jobs**: Celery workers configured for overdue processing and notifications.
9. **Analytics/Dashboard**: Aggregation endpoints for dashboard charting.
10. **Digital Library & AI**: Secured AI query endpoint and digital resource tracking.
11. **Audit Logs**: Immutable action logging for sensitive operations.
12. **UI/UX**: Premium Next.js UI using dark mode, Tailwind, responsive sidebar navigation.
13. **Deployment**: Pre-configured `docker-compose.yml` for DB, Redis, Backend, Frontend, and Celery Worker.

## How to Run

### Using Docker (Production & Development)
1. Ensure Docker and Docker Compose are installed.
2. Run the full stack:
   ```bash
   docker-compose up -d --build
   ```
3. Access the frontend at `http://localhost:3000`
4. Access the backend API docs at `http://localhost:8000/docs`

### Local Development (Without Docker)
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

## Security
- Passwords hashed using bcrypt.
- JWT tokens for stateless authentication.
- Explicit role-checking dependencies in API routes.
- SQL injection prevented via SQLAlchemy ORM.
