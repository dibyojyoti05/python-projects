from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SuggestSelectorsRequest(BaseModel):
    url: Optional[str] = Field(None, description="Optional URL to fetch sample HTML from")
    html_snippet: Optional[str] = Field(None, description="Raw HTML snippet to inspect")
    target_fields: List[str] = Field(..., description="Field names to extract, e.g. ['title', 'price', 'rating']")

class CleanDataRequest(BaseModel):
    raw_data: Dict[str, Any] = Field(..., description="Raw extracted key-value dictionary")
    schema_definition: Dict[str, Any] = Field(..., description="Target normalized schema types")

class CopilotRequest(BaseModel):
    prompt: str = Field(..., description="User query or scraping question")
    context: Optional[str] = Field(None, description="Optional page context or HTML snippet")

class CopilotResponse(BaseModel):
    response: str
