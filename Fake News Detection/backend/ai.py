import os
import json
import re
from pathlib import Path
from dotenv import load_dotenv

# Ensure .env is loaded
root_env = Path(__file__).resolve().parent.parent / ".env"
backend_env = Path(__file__).resolve().parent / ".env"
if root_env.exists():
    load_dotenv(dotenv_path=root_env)
elif backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
else:
    load_dotenv()

SYSTEM_PROMPT = """You are an expert investigative fact-checker and fake news detection AI.
Analyze the provided news content for factual credibility, sensationalism, clickbait tactics, logical fallacies, satirical elements, and source attribution.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "verdict": "Real" | "Fake" | "Satire" | "Unverified",
  "confidence": <integer 0 to 100>,
  "sensationalism_score": <integer 0 to 100, where 0 is purely neutral/factual and 100 is extreme clickbait/hysteria>,
  "bias_rating": "Neutral" | "Sensationalized" | "Extreme Bias" | "Satirical / Parody",
  "reasoning": "<A thorough 2-4 sentence explanation detailing why this verdict was reached, citing specific phrases or indicators>",
  "key_flags": ["<Specific red flag 1>", "<Specific red flag 2>"],
  "credibility_indicators": ["<Positive credibility factor 1>", "<Positive credibility factor 2>"]
}

Guidelines:
- "Real": Credible news reporting with neutral tone, corroborated events, identifiable sources, and realistic assertions.
- "Fake": Fabricated events, manipulated claims, unverified conspiracy theories, demonstrably false rumors, or pseudoscientific hoaxes.
- "Satire": Irony, parody, hyperbole, or fictionalized commentary (such as The Onion or Babylon Bee style).
- "Unverified": Ambiguous claims with insufficient context to definitively confirm or debunk.
"""

def extract_json_from_text(text: str) -> dict:
    """Robustly extract and parse JSON from model output."""
    cleaned = text.strip()
    
    # Remove markdown code block fences if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)
        cleaned = cleaned.strip()
        
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: find outermost JSON object using regex
        match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise

def rule_based_fallback_analysis(text: str) -> dict:
    """
    Intelligent heuristic fallback analyzer used when the LLM API key
    is not configured, quota is exhausted, or offline.
    """
    lower_text = text.lower()
    
    # Red flag signals
    clickbait_words = [
        "shocking", "you won't believe", "miracle cure", "secret they don't want you to know",
        "conspiracy", "illuminati", "alien invasion", "mind control", "banned by doctors",
        "5g poison", "microchip", "hoax", "wake up sheeple", "bombshell"
    ]
    satire_words = [
        "the onion", "babylon bee", "borowitz report", "satire", "parody", "humor", "fictional"
    ]
    credible_signals = [
        "according to", "reuters", "associated press", "reported by", "statement released",
        "spokesperson", "study published in", "peer-reviewed", "official records"
    ]
    
    clickbait_hits = [w for w in clickbait_words if w in lower_text]
    satire_hits = [w for w in satire_words if w in lower_text]
    cred_hits = [w for w in credible_signals if w in lower_text]
    
    # Exclamation mark / ALL CAPS density
    exclamation_count = text.count("!")
    caps_count = sum(1 for c in text if c.isupper())
    total_letters = sum(1 for c in text if c.isalpha()) or 1
    caps_ratio = caps_count / total_letters

    if satire_hits:
        verdict = "Satire"
        confidence = 88
        sensationalism = 70
        bias = "Satirical / Parody"
        reasoning = "Content contains distinct markers of parody, satire, or humorous exaggeration."
        key_flags = ["Satirical publication indicators", "Exaggerated humorous tone"]
        cred_indicators = ["Clear fictionalized narrative structure"]
    elif len(clickbait_hits) >= 2 or (len(clickbait_hits) >= 1 and (exclamation_count > 3 or caps_ratio > 0.3)):
        verdict = "Fake"
        confidence = 85
        sensationalism = min(95, 60 + len(clickbait_hits) * 10 + exclamation_count * 3)
        bias = "Sensationalized"
        reasoning = f"Flagged due to heavy sensationalist rhetoric ('{clickbait_hits[0]}'), emotional manipulation, and lack of verifiable journalistic sourcing."
        key_flags = [f"Sensationalist buzzwords: {', '.join(clickbait_hits[:3])}", "Emotional or alarmist framing", "Lack of cited official sources"]
        cred_indicators = []
    elif cred_hits:
        verdict = "Real"
        confidence = 85
        sensationalism = max(10, 30 - len(cred_hits) * 5)
        bias = "Neutral"
        reasoning = f"Presents characteristics of credible journalism with verified citations ('{cred_hits[0]}') and neutral observational tone."
        key_flags = []
        cred_indicators = ["Journalistic attribution present", "Measured reporting tone", "Absence of alarmist phrasing"]
    else:
        verdict = "Unverified"
        confidence = 65
        sensationalism = 35
        bias = "Neutral"
        reasoning = "Text does not contain enough unambiguous indicators to definitively verify or debunk. Independent cross-referencing recommended."
        key_flags = ["Independent fact-checking needed"]
        cred_indicators = ["No extreme alarmist markers detected"]

    return {
        "verdict": verdict,
        "confidence": confidence,
        "sensationalism_score": sensationalism,
        "bias_rating": bias,
        "reasoning": reasoning,
        "key_flags": key_flags,
        "credibility_indicators": cred_indicators
    }

async def analyze_news_text(text: str) -> dict:
    """
    Analyzes news text using Google Gemini AI, with graceful fallback to
    heuristic rule-based analysis if the API key is missing or quota is exhausted.
    """
    api_key = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY")
    
    # If API key is missing or default placeholder, use heuristic analyzer
    if not api_key or api_key.strip() in ("", "your_gemini_api_key_here"):
        print("[AI Engine] No valid GEMINI_API_KEY set. Using heuristic analysis engine.")
        return rule_based_fallback_analysis(text)

    # 1. Try modern google-genai SDK
    try:
        from google import genai
        from google.genai import types
        
        client = genai.Client(api_key=api_key)
        prompt = f"{SYSTEM_PROMPT}\n\nAnalyze this news text:\n\n{text}"
        
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        if response and response.text:
            return extract_json_from_text(response.text)
    except Exception as e_genai:
        print(f"[AI Engine] google.genai attempt notice: {e_genai}. Falling back to langchain...")

    # 2. Try langchain-google-genai
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import SystemMessage, HumanMessage
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=api_key,
            temperature=0.2
        )
        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Analyze this news text:\n\n{text}")
        ]
        response = await llm.ainvoke(messages)
        if response and response.content:
            return extract_json_from_text(str(response.content))
    except Exception as e_langchain:
        print(f"[AI Engine] Langchain call failed: {e_langchain}. Falling back to heuristic analyzer...")

    # 3. Fallback to heuristic analyzer on any unhandled exception (quota, offline)
    return rule_based_fallback_analysis(text)
