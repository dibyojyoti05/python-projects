from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel

class ClassificationResult(BaseModel):
    category: str
    priority: str
    intent: str
    confidence: Optional[float] = None
    requires_response: bool

class ExtractedEntities(BaseModel):
    people: List[str] = []
    companies: List[str] = []
    dates: List[str] = []
    amounts: List[str] = []
    deadlines: List[str] = []

class ActionItem(BaseModel):
    task: str
    deadline: Optional[str] = None
    priority: str

class AnalysisResult(BaseModel):
    short_summary: str
    key_points: List[str]
    action_items: List[ActionItem]
    entities: ExtractedEntities
    suggested_response: Optional[str] = None

class AIProvider(ABC):
    @abstractmethod
    async def classify_email(self, subject: str, body: str) -> ClassificationResult:
        pass

    @abstractmethod
    async def analyze_email(self, subject: str, body: str, context: Optional[str] = None) -> AnalysisResult:
        pass

    @abstractmethod
    async def generate_reply(self, subject: str, body: str, tone: str = "Professional", context: Optional[str] = None) -> str:
        pass
