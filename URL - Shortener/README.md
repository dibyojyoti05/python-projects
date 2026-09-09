# Enterprise Link Management Platform

An enterprise-grade, high-performance link management and analytics platform built with FastAPI, Next.js, PostgreSQL, and Redis. It is designed as a fully-featured SaaS offering comparable to Bitly, Dub.co, and Rebrandly.

## 🚀 Features

- **Advanced Link Management**: Shorten URLs, customize slugs, and attach metadata.
- **Enterprise Redirect Engine**: Handles password protection, expiration dates, click-limits, and device/geo-based routing seamlessly via `urllib` and `user-agents` parsers.
- **Deep Analytics & Telemetry**: Captures timeseries clicks, browser footprints, device telemetry, and geographical data. Visualized beautifully with `Recharts`.
- **Dynamic QR Code Generator**: Natively constructs highly customizable `.png` and `.svg` QR Codes using the `qrcode` library, complete with custom branding colors.
- **Bulk Campaign Generation**: Generate hundreds of links instantly with automated UTM parameter injection (`utm_source`, `utm_medium`, etc.) grouped neatly into trackable Folders.
- **Multi-Tenant Architecture**: Robust Organization and Team management. Invite users, manage permissions (Owner, Admin, Member, Viewer) with secure Role-Based Access Control (RBAC).
- **API Developer Hub**: Programmatic access via `X-API-Key`. Includes secure cryptographic hashing, a sandbox environment, and instantaneous revocation capabilities.
- **Real-Time Notifications**: Integrated WebSocket engine (`FastAPI WebSockets`) for pushing live alerts to the frontend Dashboard instantly.
- **Monetization & Quotas**: Built-in Subscription billing engine (Free, Pro, Enterprise tiers) enforcing strict limits natively on API and frontend generation routes.

## 🛠 Tech Stack

### Backend Engine
- **FastAPI**: High-performance async Python web framework.
- **SQLAlchemy (Async)**: ORM for interacting with the database using `asyncpg`.
- **PostgreSQL 15**: Primary relational database for structured telemetry and entity storage.
- **Redis**: Caching layer for lightning-fast redirect resolution.
- **Alembic**: Database schema migration tracking.
- **Pytest & HTTPX**: Comprehensive automated testing framework.

### Frontend Dashboard
- **Next.js 14 (App Router)**: React framework optimized for performance and SEO.
- **Tailwind CSS & Framer Motion**: Responsive, dynamic styling with highly polished micro-animations.
- **Zustand**: Lightweight global state management for Auth and Tenant Context.
- **Lucide React**: Clean, modern iconography.
- **Axios**: Configured HTTP client with persistent token interceptors.

---

## 💻 Local Development Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
- Node.js (v18+)
- Python (3.11+)
- Docker & Docker Compose (for DBs)

### 2. Bootstrapping the Backend
Navigate to the `backend` folder and establish a virtual environment.
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Start local PostgreSQL and Redis (requires Docker)
docker-compose up -d db redis

# Run database migrations
alembic upgrade head

# Start the development server (runs on port 8000)
uvicorn app.main:app --reload
```

### 3. Bootstrapping the Frontend
Navigate to the `frontend` directory in a separate terminal.
```bash
cd frontend

# Install dependencies
npm install

# Start the Next.js development server (runs on port 3000)
npm run dev
```

### 4. Configuration (`.env`)
Copy the `.env.example` file to `.env` in the root directory and configure the database credentials, API keys, and JWT secrets accordingly.

---

## 🐳 Production Deployment

This repository is strictly Dockerized and production-ready.

1. Ensure your `.env` file contains production secrets (`POSTGRES_PASSWORD`, `SECRET_KEY`).
2. Run the full orchestrator:
```bash
docker-compose up -d --build
```
This command will spin up:
- A multi-stage optimized `frontend` container (running Next.js Standalone).
- A robust `backend` container (FastAPI via Uvicorn).
- `postgres:15-alpine` for the database.
- `redis:7-alpine` for cache.

## 📚 API Documentation
Once the backend is running, navigate to `http://localhost:8000/docs` to view the auto-generated interactive OpenAPI/Swagger documentation.

## 🛡 License
This project is proprietary and intended for Enterprise internal routing. Do not distribute without authorization.
