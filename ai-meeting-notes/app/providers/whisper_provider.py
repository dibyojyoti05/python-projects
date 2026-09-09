import os
from pathlib import Path
from typing import Optional
from openai import OpenAI, OpenAIError

from app.config.settings import settings
from app.providers.transcription_provider import (
    TranscriptionProvider,
    TranscriptionResult,
    SpeakerSegment,
)
from app.utils.logger import logger


class WhisperProvider(TranscriptionProvider):
    """OpenAI Whisper API implementation for Speech-to-Text."""

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or settings.WHISPER_API_KEY or os.environ.get("OPENAI_API_KEY")
        self.base_url = base_url or settings.OPENAI_API_BASE

        if self.api_key:
            self.client = OpenAI(api_key=self.api_key, base_url=self.base_url)
        else:
            self.client = None
            logger.warning("Whisper API key is not configured.")

    def transcribe(self, audio_path: Path, language: Optional[str] = None) -> TranscriptionResult:
        if not self.client:
            raise ValueError(
                "Whisper API key is not set. Please configure WHISPER_API_KEY or switch to Mock Mode."
            )

        if not audio_path.exists():
            raise FileNotFoundError(f"Audio file does not exist at {audio_path}")

        file_size_mb = audio_path.stat().st_size / (1024 * 1024)
        logger.info(f"Transcribing audio file ({file_size_mb:.2f} MB): {audio_path.name}")

        try:
            with open(audio_path, "rb") as audio_file:
                # Call Whisper API with verbose_json for segment timestamps
                response = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language if language else None,
                    response_format="verbose_json"
                )

            # Parse segments if returned
            segments = []
            raw_text = getattr(response, "text", "")
            duration = getattr(response, "duration", None)
            lang = getattr(response, "language", language or "en")

            if hasattr(response, "segments") and response.segments:
                for seg in response.segments:
                    speaker_label = f"Speaker {seg.get('speaker', '')}" if 'speaker' in seg else "Speaker"
                    segments.append(
                        SpeakerSegment(
                            speaker=speaker_label,
                            start_time=float(seg.get("start", 0.0)),
                            end_time=float(seg.get("end", 0.0)),
                            text=seg.get("text", "").strip()
                        )
                    )

            return TranscriptionResult(
                raw_text=raw_text,
                language=lang,
                duration_seconds=duration,
                segments=segments,
                has_speaker_diarization=len(segments) > 0 and any(s.speaker != "Speaker" for s in segments)
            )

        except OpenAIError as e:
            logger.error(f"Whisper API transcription failed: {e}")
            raise RuntimeError(f"Whisper API error: {e}") from e
        except Exception as e:
            logger.error(f"Unexpected error during Whisper transcription: {e}")
            raise

