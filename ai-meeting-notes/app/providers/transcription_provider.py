from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel, Field


class SpeakerSegment(BaseModel):
    speaker: str = Field(description="Speaker name or label (e.g. Speaker 1)")
    start_time: float = Field(description="Start time in seconds")
    end_time: float = Field(description="End time in seconds")
    text: str = Field(description="Spoken text in this segment")


class TranscriptionResult(BaseModel):
    raw_text: str = Field(description="Full concatenated transcript")
    language: str = Field(default="en", description="Detected or requested language")
    duration_seconds: Optional[float] = Field(default=None, description="Total audio duration in seconds")
    segments: List[SpeakerSegment] = Field(default_factory=list, description="Timestamped segments if available")
    has_speaker_diarization: bool = Field(default=False, description="Whether speaker labels were detected")


class TranscriptionProvider(ABC):
    """Abstract interface for Audio/Video Speech-to-Text transcription."""

    @abstractmethod
    def transcribe(self, audio_path: Path, language: Optional[str] = None) -> TranscriptionResult:
        """Transcribe an audio file and return structured transcription result."""
        pass

