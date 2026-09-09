# Face Recognition System

An industry-level face recognition management system designed for scale, security, and precision. Built with Python (FastAPI), Next.js, InsightFace, and PostgreSQL.

## Features
- **High-Performance AI**: Uses InsightFace (buffalo_l) for generating 512D embeddings and cosine similarity for matching.
- **Microservice Architecture**: Modular backend structured with FastAPI async endpoints.
- **Premium UI**: Next.js 14 App Router, shadcn/ui, and TailwindCSS for a responsive dark-mode dashboard.
- **Robust Security**: JWT Auth, RBAC, Bcrypt hashing.
- **Dockerized Deployment**: Fully containerized environment using Docker Compose.

## Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend dev)
- Python 3.11+ (for local backend dev)

## Quick Start (Docker)

To spin up the entire application stack:
```bash
docker-compose up --build
```
1. Frontend will be accessible at `http://localhost:3000`
2. Backend API Docs (Swagger) at `http://localhost:8000/docs`
3. PostgreSQL running on port `5432`

## Local Development
### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Architecture
See the `implementation_plan.md` in the workspace documentation for a full architectural overview and Entity-Relationship Diagram.
