from .ai_provider import (
    AIProvider,
    MeetingAnalysisResult,
    ActionItemModel,
    ParticipantModel,
)
from .gemini_provider import GeminiProvider
from .transcription_provider import (
    TranscriptionProvider,
    TranscriptionResult,
    SpeakerSegment,
)
from .whisper_provider import WhisperProvider
from .mock_provider import MockAIProvider, MockTranscriptionProvider
from app.config.settings import settings


def get_ai_provider(provider_type: str = None) -> AIProvider:
    """Factory to get the configured AI Provider."""
    chosen = (provider_type or settings.AI_PROVIDER or "gemini").lower()
    if chosen == "gemini" and settings.is_gemini_ready:
        return GeminiProvider()
    elif chosen == "mock" or not settings.is_gemini_ready:
        return MockAIProvider()
    return GeminiProvider()


def get_transcription_provider(provider_type: str = None) -> TranscriptionProvider:
    """Factory to get the configured Transcription Provider."""
    chosen = (provider_type or settings.TRANSCRIPTION_PROVIDER or "mock").lower()
    if chosen == "whisper" and settings.is_whisper_ready:
        return WhisperProvider()
    return MockTranscriptionProvider()


__all__ = [
    "AIProvider",
    "MeetingAnalysisResult",
    "ActionItemModel",
    "ParticipantModel",
    "GeminiProvider",
    "TranscriptionProvider",
    "TranscriptionResult",
    "SpeakerSegment",
    "WhisperProvider",
    "MockAIProvider",
    "MockTranscriptionProvider",
    "get_ai_provider",
    "get_transcription_provider",
]

