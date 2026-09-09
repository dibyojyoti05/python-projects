import os
from openai import OpenAI

class AIEngine:
    """Engine for processing PDF text with AI (OpenAI API)."""

    @staticmethod
    def summarize_text(text: str) -> str:
        """Summarize text using OpenAI API."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
            
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Summarize the following document content concisely."},
                    {"role": "user", "content": text[:10000]} # Limit text length for safety
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"AI Summarization failed: {e}")

    @staticmethod
    def extract_keywords(text: str) -> str:
        """Extract keywords using OpenAI API."""
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set.")
            
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Extract 5-10 comma-separated keywords from the following text."},
                    {"role": "user", "content": text[:10000]}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"AI Keyword Extraction failed: {e}")
