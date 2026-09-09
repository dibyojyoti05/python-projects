from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
import httpx

from engines.ai.gemini_engine import GeminiEngine
from engines.scraper.base import ScrapeRequest
from engines.scraper.http import HttpScraper
from backend.schemas.ai import SuggestSelectorsRequest, CleanDataRequest, CopilotRequest, CopilotResponse

router = APIRouter()
ai_engine = GeminiEngine()

@router.post("/suggest-selectors", response_model=Dict[str, str])
async def suggest_selectors(request: SuggestSelectorsRequest):
    """
    Given a target URL or HTML snippet, uses Gemini AI to analyze the DOM
    and suggest optimal CSS selectors for the target fields.
    """
    html_content = request.html_snippet or ""

    # If URL is provided and no snippet, fetch the live page first
    if request.url and not html_content:
        try:
            scraper = HttpScraper()
            res = await scraper.scrape(ScrapeRequest(url=request.url, timeout=15))
            html_content = res.html
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch sample HTML from {request.url}: {e}")

    if not html_content:
        raise HTTPException(status_code=400, detail="Either 'url' or 'html_snippet' must be provided.")

    try:
        selectors = await ai_engine.generate_selectors(html_content, request.target_fields)
        return selectors
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Selector generation failed: {str(e)}")

@router.post("/clean-data", response_model=Dict[str, Any])
async def clean_data(request: CleanDataRequest):
    """
    Uses Gemini to format, normalize, and clean raw extracted data.
    """
    try:
        cleaned = await ai_engine.clean_data(request.raw_data, request.schema_definition)
        return cleaned
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Data Cleaning failed: {str(e)}")

@router.post("/copilot", response_model=CopilotResponse)
async def ai_copilot(request: CopilotRequest):
    """
    Interactive scraping assistant powered by Gemini.
    """
    try:
        reply = await ai_engine.copilot(request.prompt, request.context)
        return CopilotResponse(response=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Copilot error: {str(e)}")
