# Enterprise AI Vision Platform

A modular, scalable, secure, and production-ready Enterprise AI Vision Platform capable of real-time object recognition, tracking, analytics, and event intelligence across multi-camera streams.

## Features
- **Real-Time Object Detection & Tracking:** YOLOv8n + ByteTrack multi-object persistence.
- **Dual-Mode Streaming Resiliency:** Live RTSP video capture with automatic simulated surveillance HUD fallback for hardware-free local testing.
- **Database & Persistence:** PostgreSQL (Port 5433) with versioned Alembic schema migrations and complete audit logging.
- **Role-Based Access Control (RBAC):** Secure JWT OAuth2 authentication for Admin, Operator, and Viewer roles.
- **Comprehensive API:** Full Camera Fleet CRUD, multi-criteria Event filtering, and aggregated analytical telemetry.
- **Production Next.js Dashboard:** Built with Next.js 16 App Router, Tailwind CSS, and interactive Recharts telemetry curves.

---

## Infrastructure & Database Configuration
- **Host:** `127.0.0.1`
- **Port:** `5433`
- **Database:** `vision_platform`
- **User:** `postgres`
- **Password:** `root`

---

## Quickstart Guide

### 1. Backend Setup
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
- API Base: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm run dev
```
- Application UI: `http://localhost:3000`

---

## Pre-Configured Test Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `admin123` | Full system control, camera CRUD, system settings |
| **Operator** | `operator@example.com` | `operator123` | Live feeds, camera controls, event management |
| **Viewer** | `viewer@example.com` | `viewer123` | Read-only access to feeds and event logs |

---

## Automated Testing
Run the backend test suite:
```bash
cd backend
pytest tests/test_api.py -v
```
Run the frontend production build:
```bash
cd frontend
npm run build
```
