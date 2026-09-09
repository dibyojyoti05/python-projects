# AI Resume Analyzer & Job Matcher

An AI-powered resume analysis and job matching platform that uses NLP, vector embeddings (sentence-transformers), and Gemini to extract resume information, parse job requirements, and calculate explainable resume-job fit scores.

## Features
- **Resume Parsing:** Upload PDF or DOCX and automatically extract Skills, Experience, Education, etc.
- **Job Description Parsing:** Extract required skills, experience, and responsibilities.
- **Hybrid Matching Engine:** Computes a score based on skill overlap, semantic similarity, and experience requirements.
- **Skill Gap Analysis:** Identifies missing and preferred skills.
- **AI Recommendations:** Uses Gemini to provide personalized resume improvement suggestions.

## Tech Stack
- **Backend:** Python, FastAPI, PostgreSQL (pgvector), SQLAlchemy
- **NLP & AI:** sentence-transformers, spaCy, PyMuPDF, Gemini API
- **Frontend:** Next.js, TypeScript, TailwindCSS
- **Deployment:** Docker & Docker Compose

## Getting Started

1. Copy `.env.example` to `.env` and add your `GEMINI_API_KEY`.
2. Run `docker-compose up --build`
3. Access the API at `http://localhost:8000` and the frontend at `http://localhost:3000`
