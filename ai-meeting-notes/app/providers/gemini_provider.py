import json
import re
import time
from typing import Optional
import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, InvalidArgument, GoogleAPIError

from app.config.settings import settings
from app.providers.ai_provider import (
    AIProvider,
    MeetingAnalysisResult,
    ActionItemModel,
    ParticipantModel,
)
from app.utils.logger import logger


SYSTEM_INSTRUCTION = """You are an elite executive AI meeting analyst and secretary.
Your task is to analyze meeting transcripts with absolute accuracy, zero hallucinations, and high executive clarity.

CRITICAL GROUNDING RULES:
1. Grounding: Rely EXCLUSIVELY on facts explicitly stated or strongly supported by the transcript.
2. No Inventions: Do NOT invent decisions, action items, participants, deadlines, or topics.
3. Unspecified Values: If an assignee, deadline, or participant role is not explicitly stated, set it strictly to "Not specified".
4. Action Items: Extract genuine, clear tasks. Detect phrases like "Rahul will...", "We need to finish X by...", etc.
5. Decisions: Distinguish between general debate and finalized, agreed-upon decisions.
6. Multi-level Summaries: Provide 3 levels:
   - quick_summary: 2-3 sentences concise executive overview.
   - standard_summary: 2-3 structured paragraphs detailing key highlights.
   - detailed_summary: In-depth breakdown covering discussions, arguments, and outcomes.
7. Return strictly valid JSON conforming to the requested schema. Do NOT include markdown code blocks or conversational commentary outside the JSON.
"""

ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "title": {"type": "string", "description": "Concise descriptive title of the meeting"},
        "quick_summary": {"type": "string", "description": "2-3 sentence executive brief"},
        "standard_summary": {"type": "string", "description": "Structured 2-3 paragraph summary"},
        "detailed_summary": {"type": "string", "description": "In-depth comprehensive meeting summary"},
        "key_points": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of key points discussed"
        },
        "decisions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "List of agreed-upon decisions"
        },
        "action_items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "task": {"type": "string"},
                    "assignee": {"type": "string"},
                    "deadline": {"type": "string"},
                    "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]}
                },
                "required": ["task", "assignee", "deadline", "priority"]
            }
        },
        "questions": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Unresolved questions or open issues"
        },
        "topics": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Key agenda topics covered"
        },
        "participants": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "role": {"type": "string"}
                },
                "required": ["name"]
            }
        },
        "duration_minutes": {"type": "number", "description": "Estimated meeting duration in minutes if detected"}
    },
    "required": [
        "title",
        "quick_summary",
        "standard_summary",
        "detailed_summary",
        "key_points",
        "decisions",
        "action_items",
        "questions",
        "topics",
        "participants"
    ]
}


class GeminiProvider(AIProvider):
    """Google Gemini implementation for AI Meeting Summarization."""

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL or "gemini-1.5-flash"

        if not self.api_key:
            logger.warning("Gemini API key is not configured.")
        else:
            genai.configure(api_key=self.api_key)

    def _get_model(self, response_mime_type: str = "application/json"):
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set. Please provide an API key or enable Mock Mode.")
        
        # Generation config
        generation_config = {
            "temperature": 0.2,  # Low temperature for factuality and grounding
            "top_p": 0.95,
            "response_mime_type": response_mime_type,
        }

        return genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=SYSTEM_INSTRUCTION,
            generation_config=generation_config
        )

    def _clean_json_response(self, text: str) -> str:
        """Strip markdown code backticks and find JSON object."""
        text = text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if text.startswith("```"):
            lines = text.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        
        # Find outermost JSON object { ... }
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            return match.group(1)
        return text

    def summarize(self, transcript: str, user_title: Optional[str] = None) -> MeetingAnalysisResult:
        """Analyze meeting transcript and generate structured meeting notes with retry logic."""
        prompt = f"""Analyze the following meeting transcript and produce structured meeting notes.

USER-SPECIFIED TITLE: {user_title if user_title else "None provided (infer a professional title)"}

TRANSCRIPT:
---
{transcript}
---

Generate the complete JSON response conforming to the required schema.
"""
        max_retries = 3
        delay = 2

        for attempt in range(max_retries):
            try:
                model = self._get_model(response_mime_type="application/json")
                logger.info(f"Sending transcript ({len(transcript)} chars) to Gemini model: {self.model_name}")
                
                response = model.generate_content(prompt)
                raw_text = response.text
                cleaned_json_text = self._clean_json_response(raw_text)

                try:
                    data = json.loads(cleaned_json_text)
                except json.JSONDecodeError as json_err:
                    logger.warning(f"Failed to directly parse Gemini JSON (attempt {attempt+1}): {json_err}. Attempting recovery.")
                    # Try simple sanitize
                    cleaned_json_text = re.sub(r",\s*([\]}])", r"\1", cleaned_json_text)
                    data = json.loads(cleaned_json_text)

                # Override title if user provided one
                if user_title and user_title.strip():
                    data["title"] = user_title.strip()

                # Normalize action items
                action_items = []
                for item in data.get("action_items", []):
                    action_items.append(ActionItemModel(
                        task=item.get("task", "Unspecified task"),
                        assignee=item.get("assignee") or "Not specified",
                        deadline=item.get("deadline") or "Not specified",
                        priority=item.get("priority", "MEDIUM").upper() if item.get("priority") in ["LOW", "MEDIUM", "HIGH", "CRITICAL"] else "MEDIUM"
                    ))

                participants = []
                for p in data.get("participants", []):
                    if isinstance(p, dict):
                        participants.append(ParticipantModel(name=p.get("name", "Unknown"), role=p.get("role")))
                    elif isinstance(p, str):
                        participants.append(ParticipantModel(name=p, role=None))

                result = MeetingAnalysisResult(
                    title=data.get("title", user_title or "Meeting Summary"),
                    quick_summary=data.get("quick_summary", "Summary not available."),
                    standard_summary=data.get("standard_summary", data.get("quick_summary", "")),
                    detailed_summary=data.get("detailed_summary", data.get("standard_summary", "")),
                    key_points=data.get("key_points", []),
                    decisions=data.get("decisions", []),
                    action_items=action_items,
                    questions=data.get("questions", []),
                    topics=data.get("topics", []),
                    participants=participants,
                    duration_minutes=data.get("duration_minutes")
                )
                logger.info(f"Successfully generated structured summary with {len(result.action_items)} action items.")
                return result

            except ResourceExhausted as re_err:
                logger.warning(f"Gemini API rate limit hit (attempt {attempt+1}/{max_retries}): {re_err}")
                if attempt == max_retries - 1:
                    raise RuntimeError("Gemini API rate limit exceeded. Please wait a moment or try again.") from re_err
                time.sleep(delay)
                delay *= 2
            except InvalidArgument as ia_err:
                logger.error(f"Invalid argument to Gemini API: {ia_err}")
                raise ValueError(f"Gemini API request error: {ia_err}") from ia_err
            except GoogleAPIError as g_err:
                logger.error(f"Google API Error (attempt {attempt+1}/{max_retries}): {g_err}")
                if attempt == max_retries - 1:
                    raise RuntimeError(f"Gemini API communication failed: {g_err}") from g_err
                time.sleep(delay)
                delay *= 2
            except Exception as e:
                logger.error(f"Unexpected error during Gemini summarization: {e}")
                if attempt == max_retries - 1:
                    raise

        raise RuntimeError("Failed to summarize transcript after maximum retries.")

    def summarize_chunk(self, chunk_text: str, chunk_index: int, total_chunks: int) -> str:
        """Summarize an individual chunk of a large transcript."""
        prompt = f"""Summarize this section (Part {chunk_index} of {total_chunks}) of a long meeting transcript.
Capture all key points, discussions, tentative decisions, names of speakers, and any mentioned action items or deadlines.
Be factual and concise.

CHUNK TEXT:
---
{chunk_text}
---
"""
        try:
            model = self._get_model(response_mime_type="text/plain")
            response = model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            logger.error(f"Error summarizing chunk {chunk_index}/{total_chunks}: {e}")
            raise

