from fastapi import APIRouter
from pydantic import BaseModel
import os
import httpx
import json

router = APIRouter(prefix="/api/ai", tags=["AI Assistant"])

DEFAULT_GEMINI_KEY = ""

class AIRequest(BaseModel):
    query: str
    weather_context: str

def generate_rule_based_advice(query: str, weather_context: str) -> str:
    """Intelligent fallback if Gemini API is unreachable or times out."""
    q = query.lower()
    ctx_lower = weather_context.lower()
    
    advice = []
    
    # Clothing query
    if any(w in q for w in ["wear", "cloth", "dress", "jacket", "coat", "outfit"]):
        if any(w in ctx_lower for w in ["rain", "drizzle", "shower", "thunder"]):
            advice.append("A waterproof jacket or trench coat with water-resistant footwear is strongly advised.")
        elif any(w in ctx_lower for w in ["snow", "freeze", "frost"]):
            advice.append("Wear thermal layers, a heavy insulated coat, gloves, and a warm beanie.")
        elif "overcast" in ctx_lower or "cloud" in ctx_lower:
            advice.append("Light layers (such as a sweater or light jacket over a t-shirt) work best today.")
        else:
            advice.append("Comfortable, breathable casual wear is recommended for clear weather.")
            
    # Rain / umbrella query
    if any(w in q for w in ["rain", "umbrella", "wet", "precipitation"]):
        if any(w in ctx_lower for w in ["rain", "drizzle", "shower", "thunder"]):
            advice.append("Yes, precipitation is expected today—keep a sturdy umbrella on hand!")
        else:
            advice.append("No heavy rain is in the immediate forecast, but keep an eye on cloud cover shifts.")

    # Workout / outdoor query
    if any(w in q for w in ["run", "workout", "sport", "outside", "outdoor", "walk", "bike"]):
        if any(w in ctx_lower for w in ["rain", "storm", "gale"]):
            advice.append("Outdoor exercise might be uncomfortable due to rain/wind. Indoor workouts are preferable.")
        else:
            advice.append("Conditions look favorable for outdoor activities and jogging.")

    if not advice:
        advice.append("Stay hydrated, monitor local forecasts for sudden shifts, and plan your day according to the current conditions!")

    return " ".join(advice)

@router.post("/ask")
async def ask_ai(req: AIRequest):
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("AI_API_KEY") or DEFAULT_GEMINI_KEY
    
    # Try calling Google Gemini
    if api_key:
        system_instruction = (
            "You are an expert Weather Intelligence Assistant. "
            "Analyze the provided real-time weather conditions and forecast to give practical, direct, "
            "and friendly answers. Include advice on clothing, outdoor activities, UV protection, or travel if relevant. "
            "Keep responses concise, clear, and engaging (2 to 4 sentences)."
        )
        prompt = (
            f"{system_instruction}\n\n"
            f"--- WEATHER DATA ---\n"
            f"{req.weather_context}\n\n"
            f"--- USER QUESTION ---\n"
            f"{req.query}"
        )
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key={api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.7, "maxOutputTokens": 300}
                }
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return {"response": parts[0]["text"].strip()}
        except Exception:
            pass

    # Intelligent fallback
    return {"response": generate_rule_based_advice(req.query, req.weather_context)}
