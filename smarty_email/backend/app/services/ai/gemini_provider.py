import os
import json
from typing import Optional
from google import genai
from google.genai import types

from app.services.ai.base import (
    AIProvider,
    ClassificationResult,
    AnalysisResult,
    ExtractedEntities,
    ActionItem
)

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)
        self.model = "gemini-2.5-flash" # Use a fast model for basic tasks, can be configurable

    async def classify_email(self, subject: str, body: str) -> ClassificationResult:
        prompt = f"""
        Classify the following email.
        Subject: {subject}
        Body: {body}
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ClassificationResult,
                temperature=0.1
            )
        )
        # Parse the JSON response into our Pydantic model
        result_dict = json.loads(response.text)
        return ClassificationResult(**result_dict)

    async def analyze_email(self, subject: str, body: str, context: Optional[str] = None) -> AnalysisResult:
        prompt = f"""
        Analyze the following email and extract key information.
        Subject: {subject}
        Body: {body}
        
        Context: {context if context else 'None'}
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.2
            )
        )
        result_dict = json.loads(response.text)
        return AnalysisResult(**result_dict)

    async def generate_reply(self, subject: str, body: str, tone: str = "Professional", context: Optional[str] = None) -> str:
        prompt = f"""
        Generate a reply to the following email.
        The tone should be: {tone}.
        
        Original Subject: {subject}
        Original Body: {body}
        
        Context history: {context if context else 'None'}
        """
        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7
            )
        )
        return response.text
