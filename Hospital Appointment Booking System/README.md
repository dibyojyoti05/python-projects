# Hospital Appointment Booking System

A complete, fully functional, secure, responsive, production-quality Hospital Appointment and Patient Management Platform.

## Features
- **RBAC (Role-Based Access Control):** Secure access for Super Admin, Admin, Doctor, Receptionist, and Patient.
- **Appointment Scheduling:** Dynamic available slot calculation preventing double-booking using robust concurrency control.
- **Clinical Workflows:** Medical records, consultations, diagnoses, and prescriptions.
- **Billing:** Invoice generation, payment tracking, and PDF exports.
- **Notifications:** In-app and email notifications.
- **Security:** JWT authentication, IDOR/BOLA protection, rate limiting, and secure file uploads.

## Technology Stack
- **Backend:** Django 5.2, Django REST Framework, SimpleJWT, ReportLab
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS, Lucide Icons
- **Database:** PostgreSQL (configured on port 5433 / default port 5432)
- **Infrastructure:** Docker, Docker Compose

## Preconfigured Test Credentials
The database comes seeded with demo accounts for each role:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@hospital.com` | `Admin@123` | Full access, settings & audit logs |
| **Doctor** | `doctor.smith@hospital.com` | `Doctor@123` | Interventional Cardiology, schedule 9-5 |
| **Doctor** | `doctor.sarah@hospital.com` | `Doctor@123` | Neurology, schedule 9-5 |
| **Receptionist** | `receptionist@hospital.com` | `Reception@123` | Desk check-in, appointments & billing |
| **Patient** | `patient@hospital.com` | `Patient@123` | Michael Brown, has booked appointments & invoices |
| **Patient** | `jane@hospital.com` | `Patient@123` | Jane Williams |

## Quick Start & Running Locally

### Option 1: Native Execution (with PostgreSQL)
1. **Configure Database & Environment**:
   Ensure PostgreSQL is running on `127.0.0.1:5433` (or your configured port) and verify `.env`:
   ```env
   USE_POSTGRES=True
   POSTGRES_DB=hospital_db
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=root
   POSTGRES_HOST=127.0.0.1
   POSTGRES_PORT=5433
   ```
2. **Backend**:
   ```bash
   cd backend
   python manage.py migrate
   python seed_data.py          # Seeds initial departments, doctors, schedules, patients
   python manage.py test        # Run full automated test suite (8 tests)
   python manage.py runserver 8000
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm run build                # Verify production build
   npm run dev                  # Start dev server on http://localhost:3000
   ```

### Option 2: Docker Compose
```bash
docker-compose up --build
docker-compose exec backend python manage.py migrate
docker-compose exec backend python seed_data.py
```

## Available Dashboards & Routes
- `/login`: Role-based redirect to dedicated portal
- `/register`: Patient self-service registration
- `/dashboard/admin`: System metrics, departments & audit controls
- `/dashboard/doctor`: Today's schedule, patient consultations & prescription generator
- `/dashboard/receptionist`: Desk management & patient check-in
- `/dashboard/patient`: Health summary & upcoming appointments
- `/dashboard/patient/book`: Multi-step booking wizard with dynamic available slot calculation
- `/dashboard/appointments`: Filterable appointment table with cancellation & check-in actions
- `/dashboard/patients`: Patient directory with demographic cards & clinical profile modals
- `/dashboard/records`: Medical records, diagnoses, and prescription items
- `/dashboard/billing`: Invoices, status badges, payment recording & ReportLab PDF download
- `/dashboard/documents`: Secure medical document upload & download
- `/dashboard/settings`: Profile update, doctor schedules, departments & system health status

