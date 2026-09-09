from pathlib import Path
from typing import Set, Tuple
from app.config.settings import settings


SUPPORTED_TEXT_EXTENSIONS: Set[str] = {".txt", ".md", ".docx", ".pdf"}
SUPPORTED_AUDIO_EXTENSIONS: Set[str] = {".mp3", ".wav", ".m4a", ".webm"}
SUPPORTED_VIDEO_EXTENSIONS: Set[str] = {".mp4", ".webm", ".mov"}
ALL_SUPPORTED_EXTENSIONS: Set[str] = (
    SUPPORTED_TEXT_EXTENSIONS | SUPPORTED_AUDIO_EXTENSIONS | SUPPORTED_VIDEO_EXTENSIONS
)


def validate_file_type(filename: str) -> Tuple[bool, str, str]:
    """
    Validates file extension and identifies file category (text, audio, video).
    Returns (is_valid, category, error_message).
    """
    ext = Path(filename).suffix.lower()
    if not ext:
        return False, "unknown", "File does not have a valid extension."

    if ext in SUPPORTED_TEXT_EXTENSIONS:
        return True, "text", ""
    elif ext in SUPPORTED_AUDIO_EXTENSIONS:
        return True, "audio", ""
    elif ext in SUPPORTED_VIDEO_EXTENSIONS:
        return True, "video", ""
    else:
        supported = ", ".join(sorted(ALL_SUPPORTED_EXTENSIONS))
        return False, "unsupported", f"Unsupported file extension '{ext}'. Supported: {supported}"


def validate_file_size(size_in_bytes: int, max_mb: int = None) -> Tuple[bool, str]:
    """
    Validates that file size is within limits.
    Returns (is_valid, error_message).
    """
    limit_mb = max_mb or settings.MAX_FILE_SIZE_MB
    max_bytes = limit_mb * 1024 * 1024

    if size_in_bytes <= 0:
        return False, "Uploaded file is empty (0 bytes)."

    if size_in_bytes > max_bytes:
        file_mb = size_in_bytes / (1024 * 1024)
        return (
            False,
            f"File size ({file_mb:.1f} MB) exceeds maximum allowed limit of {limit_mb} MB."
        )

    return True, ""


def validate_transcript_text(text: str) -> Tuple[bool, str]:
    """
    Validates transcript text content before summarization.
    """
    if not text or not text.strip():
        return False, "Transcript text is empty or contains only whitespace."

    cleaned_words = text.strip().split()
    if len(cleaned_words) < 5:
        return False, "Transcript is too short to summarize (minimum 5 words required)."

    return True, ""

