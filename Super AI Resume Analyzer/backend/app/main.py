from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, resumes, jobs, matches, history, writing
from app.db.session import engine
from app.models.base import Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="AI Resume Analyzer & Job Matcher API",
    description="API for parsing resumes, extracting requirements from jobs, and computing AI match scores.",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(resumes.router, prefix="/api/resumes", tags=["resumes"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(history.router, prefix="/api/history", tags=["history"])
app.include_router(writing.router, prefix="/api/writing", tags=["writing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Resume Analyzer API"}
