from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, jobs, scraping, applications, interviews, analytics

app = FastAPI(
    title="Smart Job Application Tracker API",
    description="API for managing job applications, scraping job boards, and tracking interviews.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(scraping.router, prefix="/api/scraping", tags=["scraping"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(interviews.router_interviews, prefix="/api/interviews", tags=["interviews"])
app.include_router(interviews.router_followups, prefix="/api/followups", tags=["followups"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Job Application Tracker API"}
