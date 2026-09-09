import json
import re
import httpx
from typing import Dict, Any, List, Optional
from engines.ai.base import BaseAIEngine
from backend.core.config import settings

class GeminiEngine(BaseAIEngine):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = "gemini-flash-latest"
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def _generate(self, prompt: str, temperature: float = 0.2) -> str:
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        # If a model experiences high demand (503) or rate limits (429), fall back to alternate Gemini models
        models_to_try = [self.model, "gemini-pro-latest", "gemini-2.5-flash-lite"]
        last_error = ""

        async with httpx.AsyncClient(timeout=30.0) as client:
            for m in models_to_try:
                url = f"{self.base_url}/models/{m}:generateContent?key={self.api_key}"
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }],
                    "generationConfig": {
                        "temperature": temperature,
                        "maxOutputTokens": 2048
                    }
                }
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        data = response.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            texts = [p.get("text", "") for p in parts if "text" in p]
                            if texts:
                                return "".join(texts)
                    last_error = f"Gemini API Error ({response.status_code}): {response.text}"
                except Exception as e:
                    last_error = str(e)
                    continue

        raise RuntimeError(last_error)

    async def generate_selectors(self, html_snippet: str, target_fields: List[str]) -> Dict[str, str]:
        """
        Analyzes an HTML snippet and returns a dictionary mapping target field names
        to the best CSS selectors.
        """
        truncated_html = html_snippet[:8000] if len(html_snippet) > 8000 else html_snippet

        prompt = f"""You are an expert web scraping and DOM extraction specialist.
Analyze the following HTML snippet and determine the most resilient, specific CSS selectors to extract each of these target fields: {target_fields}.

HTML Snippet:
```html
{truncated_html}
```

Instructions:
1. Return ONLY a valid JSON object where keys are the target field names and values are the CSS selector strings.
2. If a field cannot be found, provide a best-effort common selector for that field.
3. Example output:
{{"title": "h1.product-title", "price": "span.price", "image": "img.main-img"}}
"""
        try:
            raw_reply = await self._generate(prompt)
            clean_reply = re.sub(r"```(?:json)?", "", raw_reply).strip()
            match = re.search(r"\{.*\}", clean_reply, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(clean_reply)
        except Exception:
            # Fallback heuristic if network fails or invalid JSON
            results = {}
            for field in target_fields:
                f_lower = field.lower()
                if "title" in f_lower or "name" in f_lower:
                    results[field] = "h1, h2, .title, a.title"
                elif "price" in f_lower or "cost" in f_lower:
                    results[field] = ".price, span.price, p.price"
                elif "image" in f_lower or "img" in f_lower or "pic" in f_lower:
                    results[field] = "img"
                elif "link" in f_lower or "url" in f_lower:
                    results[field] = "a"
                else:
                    results[field] = f".{f_lower}"
            return results

    async def clean_data(self, raw_data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes extracted raw data values using Gemini.
        """
        prompt = f"""Normalize and clean the following extracted web data according to the expected fields schema.
Raw Data:
{json.dumps(raw_data)}

Target Schema:
{json.dumps(schema)}

Format prices as numbers where appropriate, remove excessive whitespace, format dates, and return strictly as a JSON object.
"""
        try:
            raw_reply = await self._generate(prompt)
            clean_reply = re.sub(r"```(?:json)?", "", raw_reply).strip()
            match = re.search(r"\{.*\}", clean_reply, re.DOTALL)
            if match:
                return json.loads(match.group(0))
            return json.loads(clean_reply)
        except Exception:
            return raw_data

    async def copilot(self, query: str, context: Optional[str] = None) -> str:
        """
        Provides conversational web scraping troubleshooting, regex help, and selector recommendations.
        """
        system_instructions = (
            "You are the AI Scraping Copilot for the Enterprise Web Scraping Platform. "
            "Help the user formulate CSS/XPath selectors, advise on bypassing rate limits or scraping anti-patterns, "
            "and suggest clean data extraction workflows. Be concise, actionable, and technical."
        )
        prompt = f"{system_instructions}\n\n"
        if context:
            prompt += f"Scraping Context / HTML / Target URL:\n{context}\n\n"
        prompt += f"User Question: {query}"

        try:
            return await self._generate(prompt, temperature=0.4)
        except Exception:
            return (
                "AI Scraping Advisor: Always inspect robots.txt, rotate realistic browser User-Agents, "
                "and set a reasonable crawl delay (1-2s) to avoid IP rate-limiting. For dynamic content, use the Headless Playwright engine."
            )
