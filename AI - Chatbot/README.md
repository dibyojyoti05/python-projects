# Enterprise AI Assistant Platform

A full-fledged Enterprise AI Assistant SaaS platform complete with multi-model intelligence, RAG vector search, premium Next.js frontend, Stripe payments, and Docker deployments.

## Architecture
- **Frontend:** Next.js 15, React 19, Tailwind CSS, Framer Motion, Zustand
- **Backend:** FastAPI, Python 3.11+, SQLAlchemy 2.0 (Async)
- **Database:** PostgreSQL (Relational), Qdrant (Vector)
- **AI Core:** LiteLLM (GPT-4o, Claude 3.5, Gemini 1.5 Pro)

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### Local Development

**1. Backend**
```bash
cd backend
python -m venv venv
# Activate venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev
```

### Production Deployment
The entire platform is containerized.
```bash
docker-compose up --build -d
```

## Features
- **Stateless Auth:** Secure JWT authentication via Passlib/Bcrypt.
- **RAG Intelligence:** Qdrant powered vector search using `sentence-transformers`.
- **SSE Streaming:** Real-time token streaming to the frontend.
- **Tool Calling Registry:** Pluggable Python functions executed by the AI.
- **Admin Dashboard:** System health monitoring.
- **Payments:** Stripe Checkout Session webhooks.
