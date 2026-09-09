# Smart Job Application Tracker

A smart, automated job application tracking platform that helps users discover job opportunities, save relevant jobs, track applications, manage interviews, schedule follow-ups, and analyze their job-search activity.

## Features
- **Job Discovery & Scraping:** Automated background scraping of job sources.
- **Job Normalization:** Standardizes job data across different platforms.
- **Duplicate Detection:** Prevents duplicate job entries.
- **Kanban Application Board:** Visually track application stages.
- **Interview & Follow-up Management:** Schedule reminders and track details.
- **Analytics Dashboard:** Visualize application success rates and pipeline metrics.

## Tech Stack
- **Backend:** Python, FastAPI, PostgreSQL, SQLAlchemy, Celery, Redis
- **Frontend:** Next.js, TypeScript, TailwindCSS
- **Deployment:** Docker & Docker Compose

## Getting Started

1. Copy `.env.example` to `.env`
2. Run `docker-compose up --build`
3. Access the API at `http://localhost:8000` and the frontend at `http://localhost:3000`
