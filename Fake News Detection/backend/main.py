import hashlib
import re
from typing import List, Optional
import requests
from bs4 import BeautifulSoup

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

import uvicorn
from database import engine, Base, get_db
import models
from schemas import (
    NewsRequest,
    AnalysisResponse,
    FeedbackRequest,
    StatsResponse,
    SampleArticle
)
from ai import analyze_news_text

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TruthLens AI - Fake News Detection API",
    description="Enterprise-grade Fake News Detection Engine backed by PostgreSQL & Gemini AI",
    version="2.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def compute_hash(text: str) -> str:
    """Compute SHA-256 hash of normalized text for instant database cache lookup."""
    normalized = " ".join(text.lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

def is_url(text: str) -> bool:
    """Check if input text looks like a URL."""
    url_pattern = re.compile(
        r'^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$',
        re.IGNORECASE
    )
    return bool(url_pattern.match(text.strip()))

def extract_content_from_url(url: str) -> tuple[str, Optional[str]]:
    """Scrapes clean article body and title from a web URL."""
    cleaned_url = url.strip()
    if not cleaned_url.startswith("http://") and not cleaned_url.startswith("https://"):
        cleaned_url = "https://" + cleaned_url

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    try:
        response = requests.get(cleaned_url, timeout=12, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract title
        title = None
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        og_title = soup.find("meta", property="og:title")
        if og_title and og_title.get("content"):
            title = og_title["content"].strip()

        # Remove irrelevant non-content elements
        for element in soup(["script", "style", "nav", "footer", "header", "noscript", "aside", "form"]):
            element.decompose()

        # Prefer <article> or <main> if present
        container = soup.find("article") or soup.find("main") or soup.body
        if not container:
            container = soup

        paragraphs = container.find_all("p")
        if paragraphs:
            text = " ".join(p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 30)
        else:
            text = container.get_text(separator=' ')

        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        clean_text = " ".join(chunk for chunk in chunks if chunk)

        return clean_text, title
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Unable to extract article text from URL: {str(e)}"
        )

SAMPLE_ARTICLES = [
    SampleArticle(
        id="sample-1",
        category="Viral Hoax / Conspiracy",
        title="Secret Lunar Colony Discovered",
        text="BREAKING: Declassified government documents have revealed an undercover military base on the far side of the moon funded by the Illuminati. Whistleblowers claim scientists have been harnessing alien zero-point energy since 1968. Share this before the mainstream media deletes it! WAKE UP SHEEPLE!"
    ),
    SampleArticle(
        id="sample-2",
        category="Satire / Parody",
        title="Local Man Solves Global Warming By Turning AC Up",
        text="According to reports from The Onion, 34-year-old Greg Miller successfully tackled planetary climate catastrophe this Tuesday by setting his central air conditioner to an unprecedented 64 degrees Fahrenheit. 'If everyone just opens their freezer doors simultaneously, we can reverse polar ice melt by Thursday,' Miller declared."
    ),
    SampleArticle(
        id="sample-3",
        category="Verified Journalistic News",
        title="James Webb Space Telescope Observes Distant Exoplanet",
        text="Astronomers using NASA's James Webb Space Telescope have detected atmospheric water vapor and carbon dioxide on exoplanet WASP-96b, according to a study published Thursday in Nature Astronomy. Dr. Elena Vance, lead astrophysicist at the European Space Agency, stated in an official press briefing that the spectroscopic data provides the most detailed molecular profile of a gas giant outside our solar system to date."
    ),
    SampleArticle(
        id="sample-4",
        category="Sensational Clickbait",
        title="Banned Miracle Fruit Cures All Diseases in 48 Hours",
        text="Doctors are stunned by this shocking miracle fruit hidden deep in the Amazon rainforest! Big Pharma is actively trying to silence this discovery because it completely eradicates every medical condition overnight without surgery. You won't believe what happens when you eat just one slice a day!"
    )
]

@app.get("/api/samples", response_model=List[SampleArticle])
def get_sample_articles():
    """Return pre-packaged sample news articles for instant 1-click testing."""
    return SAMPLE_ARTICLES

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_news(request: NewsRequest, db: Session = Depends(get_db)):
    """
    Main verification endpoint.
    Performs URL scraping (if URL), checks PostgreSQL cache by content hash,
    runs the AI credibility engine if new, and stores the result in PostgreSQL.
    """
    raw_input = request.text.strip()
    if len(raw_input) < 15:
        raise HTTPException(status_code=400, detail="Input text must be at least 15 characters long.")

    input_type = "text"
    source_url = None
    extracted_title = None
    text_to_analyze = raw_input

    # Check if input is a URL
    if is_url(raw_input):
        input_type = "url"
        source_url = raw_input
        extracted_text, extracted_title = extract_content_from_url(raw_input)
        if len(extracted_text) < 25:
            raise HTTPException(
                status_code=400,
                detail="Scraped content from this URL is too short to analyze. Please paste the article text directly."
            )
        text_to_analyze = extracted_text

    # Compute content hash for fast cache lookup
    content_hash = compute_hash(text_to_analyze)

    # 1. Check PostgreSQL Database Cache
    existing_analysis = db.query(models.Analysis).filter(
        models.Analysis.content_hash == content_hash
    ).first()

    if existing_analysis:
        existing_analysis.times_queried += 1
        db.commit()
        db.refresh(existing_analysis)

        # Count feedback votes
        upvotes = db.query(models.Feedback).filter(
            models.Feedback.analysis_id == existing_analysis.id,
            models.Feedback.vote == "agree"
        ).count()
        downvotes = db.query(models.Feedback).filter(
            models.Feedback.analysis_id == existing_analysis.id,
            models.Feedback.vote == "disagree"
        ).count()

        return AnalysisResponse(
            id=existing_analysis.id,
            content_hash=existing_analysis.content_hash,
            input_type=existing_analysis.input_type,
            source_url=existing_analysis.source_url,
            title=existing_analysis.title,
            verdict=existing_analysis.verdict,
            confidence=existing_analysis.confidence,
            sensationalism_score=existing_analysis.sensationalism_score,
            bias_rating=existing_analysis.bias_rating,
            reasoning=existing_analysis.reasoning,
            key_flags=existing_analysis.key_flags or [],
            credibility_indicators=existing_analysis.credibility_indicators or [],
            times_queried=existing_analysis.times_queried,
            is_cached=True,
            created_at=existing_analysis.created_at,
            upvotes=upvotes,
            downvotes=downvotes
        )

    # 2. Run AI Credibility Analysis
    ai_result = await analyze_news_text(text_to_analyze)

    # Generate a descriptive title if none extracted
    if not extracted_title:
        words = text_to_analyze.split()
        extracted_title = " ".join(words[:10]) + ("..." if len(words) > 10 else "")

    # 3. Save new record into PostgreSQL
    new_analysis = models.Analysis(
        content_hash=content_hash,
        input_type=input_type,
        source_url=source_url,
        title=extracted_title[:255] if extracted_title else "News Item",
        cleaned_text=text_to_analyze[:4000],  # Store clean snippet
        verdict=ai_result.get("verdict", "Unverified"),
        confidence=int(ai_result.get("confidence", 50)),
        sensationalism_score=int(ai_result.get("sensationalism_score", 0)),
        bias_rating=ai_result.get("bias_rating", "Neutral"),
        reasoning=ai_result.get("reasoning", "Analysis complete."),
        key_flags=ai_result.get("key_flags", []),
        credibility_indicators=ai_result.get("credibility_indicators", []),
        times_queried=1
    )

    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)

    return AnalysisResponse(
        id=new_analysis.id,
        content_hash=new_analysis.content_hash,
        input_type=new_analysis.input_type,
        source_url=new_analysis.source_url,
        title=new_analysis.title,
        verdict=new_analysis.verdict,
        confidence=new_analysis.confidence,
        sensationalism_score=new_analysis.sensationalism_score,
        bias_rating=new_analysis.bias_rating,
        reasoning=new_analysis.reasoning,
        key_flags=new_analysis.key_flags or [],
        credibility_indicators=new_analysis.credibility_indicators or [],
        times_queried=1,
        is_cached=False,
        created_at=new_analysis.created_at,
        upvotes=0,
        downvotes=0
    )

@app.get("/api/history", response_model=List[AnalysisResponse])
def get_history(limit: int = 30, db: Session = Depends(get_db)):
    """Fetch recent scans from PostgreSQL database."""
    records = db.query(models.Analysis).order_by(desc(models.Analysis.created_at)).limit(limit).all()

    results = []
    for r in records:
        up = db.query(models.Feedback).filter(
            models.Feedback.analysis_id == r.id,
            models.Feedback.vote == "agree"
        ).count()
        down = db.query(models.Feedback).filter(
            models.Feedback.analysis_id == r.id,
            models.Feedback.vote == "disagree"
        ).count()

        results.append(
            AnalysisResponse(
                id=r.id,
                content_hash=r.content_hash,
                input_type=r.input_type,
                source_url=r.source_url,
                title=r.title,
                verdict=r.verdict,
                confidence=r.confidence,
                sensationalism_score=r.sensationalism_score,
                bias_rating=r.bias_rating,
                reasoning=r.reasoning,
                key_flags=r.key_flags or [],
                credibility_indicators=r.credibility_indicators or [],
                times_queried=r.times_queried,
                is_cached=False,
                created_at=r.created_at,
                upvotes=up,
                downvotes=down
            )
        )
    return results

@app.get("/api/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Calculate aggregated platform analytics from PostgreSQL."""
    total = db.query(models.Analysis).count()
    real_c = db.query(models.Analysis).filter(models.Analysis.verdict == "Real").count()
    fake_c = db.query(models.Analysis).filter(models.Analysis.verdict == "Fake").count()
    satire_c = db.query(models.Analysis).filter(models.Analysis.verdict == "Satire").count()
    unver_c = db.query(models.Analysis).filter(models.Analysis.verdict == "Unverified").count()

    avg_conf = db.query(func.avg(models.Analysis.confidence)).scalar() or 0.0
    
    # Calculate sum of repeat cache queries
    total_queried = db.query(func.sum(models.Analysis.times_queried)).scalar() or 0
    cached_served = max(0, total_queried - total)

    return StatsResponse(
        total_scans=total,
        real_count=real_c,
        fake_count=fake_c,
        satire_count=satire_c,
        unverified_count=unver_c,
        avg_confidence=round(float(avg_conf), 1),
        cached_queries_served=cached_served
    )

@app.post("/api/feedback")
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    """Submit agree/disagree vote for a specific analysis."""
    analysis = db.query(models.Analysis).filter(models.Analysis.id == req.analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis record not found.")

    fb = models.Feedback(
        analysis_id=req.analysis_id,
        vote=req.vote,
        comment=req.comment
    )
    db.add(fb)
    db.commit()

    up = db.query(models.Feedback).filter(
        models.Feedback.analysis_id == req.analysis_id,
        models.Feedback.vote == "agree"
    ).count()
    down = db.query(models.Feedback).filter(
        models.Feedback.analysis_id == req.analysis_id,
        models.Feedback.vote == "disagree"
    ).count()

    return {"message": "Feedback submitted successfully.", "upvotes": up, "downvotes": down}

@app.delete("/api/history/{analysis_id}")
def delete_history_item(analysis_id: int, db: Session = Depends(get_db)):
    """Delete a scan record from PostgreSQL."""
    item = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    db.delete(item)
    db.commit()
    return {"message": f"Analysis #{analysis_id} removed from database."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
