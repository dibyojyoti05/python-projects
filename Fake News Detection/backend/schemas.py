from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class NewsRequest(BaseModel):
    text: str = Field(..., min_length=15, description="Article text or full news URL")

class FeedbackRequest(BaseModel):
    analysis_id: int
    vote: str = Field(..., pattern="^(agree|disagree)$")
    comment: Optional[str] = None

class AnalysisResponse(BaseModel):
    id: int
    content_hash: str
    input_type: str
    source_url: Optional[str] = None
    title: Optional[str] = None
    verdict: str
    confidence: int
    sensationalism_score: int
    bias_rating: str
    reasoning: str
    key_flags: List[str] = []
    credibility_indicators: List[str] = []
    times_queried: int = 1
    is_cached: bool = False
    created_at: datetime
    upvotes: int = 0
    downvotes: int = 0

    class Config:
        from_attributes = True

class StatsResponse(BaseModel):
    total_scans: int
    real_count: int
    fake_count: int
    satire_count: int
    unverified_count: int
    avg_confidence: float
    cached_queries_served: int

class SampleArticle(BaseModel):
    id: str
    category: str
    title: str
    text: str
