import os
import subprocess
import shutil
from pathlib import Path
from typing import Optional, Tuple
from app.providers import get_transcription_provider, TranscriptionProvider, TranscriptionResult
from app.utils.logger import logger
from app.utils.validators import validate_file_type


class TranscriptionService:
    """Orchestrates speech-to-text transcription and audio/video handling."""

    def __init__(self, provider: Optional[TranscriptionProvider] = None):
        self.provider = provider or get_transcription_provider()

    def process_media_file(self, file_path: Path, language: Optional[str] = None) -> TranscriptionResult:
        """
        Processes audio or video file, extracts audio if video, and generates transcription.
        """
        if not file_path.exists():
            raise FileNotFoundError(f"Media file not found: {file_path}")

        is_valid, category, err = validate_file_type(file_path.name)
        if not is_valid or category not in ["audio", "video"]:
            raise ValueError(f"Invalid media file for transcription: {err or file_path.suffix}")

        audio_to_transcribe = file_path

        # If video, extract audio track first if ffmpeg is available
        if category == "video":
            audio_to_transcribe = self._extract_audio_from_video(file_path)

        try:
            logger.info(f"Starting transcription using {self.provider.__class__.__name__} for {audio_to_transcribe.name}")
            result = self.provider.transcribe(audio_to_transcribe, language=language)
            logger.info(f"Transcription completed successfully ({len(result.raw_text)} chars).")
            return result
        finally:
            # Clean up extracted temp audio if created
            if audio_to_transcribe != file_path and audio_to_transcribe.exists():
                try:
                    os.remove(audio_to_transcribe)
                except Exception as e:
                    logger.warning(f"Could not remove temporary audio file: {e}")

    def _extract_audio_from_video(self, video_path: Path) -> Path:
        """Extracts MP3 audio from video file using FFmpeg if available, or returns path."""
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            logger.warning("FFmpeg not found on PATH. Attempting direct processing with provider.")
            return video_path

        output_audio = video_path.with_suffix(".mp3")
        try:
            logger.info(f"Extracting audio track from video {video_path.name} -> {output_audio.name}")
            cmd = [
                ffmpeg_bin, "-y", "-i", str(video_path),
                "-vn", "-acodec", "libmp3lame", "-q:a", "4", str(output_audio)
            ]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            return output_audio
        except Exception as e:
            logger.warning(f"FFmpeg audio extraction failed ({e}). Reverting to direct file.")
            return video_path

