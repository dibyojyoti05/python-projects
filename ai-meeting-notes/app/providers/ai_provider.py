from abc import ABC, abstractmethod
from typing import List, Optional
from pydantic import BaseModel, Field


class ActionItemModel(BaseModel):
    task: str = Field(description="Action item or task description")
    assignee: str = Field(default="Not specified", description="Name of assigned person, or 'Not specified'")
    deadline: str = Field(default="Not specified", description="Deadline or due date, or 'Not specified'")
    priority: str = Field(default="MEDIUM", description="Priority level: LOW, MEDIUM, HIGH, or CRITICAL")


class ParticipantModel(BaseModel):
    name: str = Field(description="Participant name or identifier")
    role: Optional[str] = Field(default=None, description="Role or title if explicitly mentioned")


class MeetingAnalysisResult(BaseModel):
    title: str = Field(default="Meeting Summary", description="Concise, descriptive title for the meeting")
    quick_summary: str = Field(description="High-level 2-3 sentence executive overview")
    standard_summary: str = Field(description="Structured standard summary with main discussions")
    detailed_summary: str = Field(description="Comprehensive detailed summary of all meeting aspects")
    key_points: List[str] = Field(default_factory=list, description="Key discussion points")
    decisions: List[str] = Field(default_factory=list, description="Confirmed decisions made during the meeting")
    action_items: List[ActionItemModel] = Field(default_factory=list, description="Extracted actionable items")
    questions: List[str] = Field(default_factory=list, description="Open questions or unresolved issues")
    topics: List[str] = Field(default_factory=list, description="Important topics covered")
    participants: List[ParticipantModel] = Field(default_factory=list, description="Participants detected")
    duration_minutes: Optional[float] = Field(default=None, description="Estimated duration in minutes if mentioned")


class AIProvider(ABC):
    """Abstract interface for AI summarization providers."""

    @abstractmethod
    def summarize(self, transcript: str, user_title: Optional[str] = None) -> MeetingAnalysisResult:
        """Analyze a full meeting transcript and generate structured meeting analysis."""
        pass

    @abstractmethod
    def summarize_chunk(self, chunk_text: str, chunk_index: int, total_chunks: int) -> str:
        """Summarize an individual chunk of a long transcript for map-reduce synthesis."""
        pass

