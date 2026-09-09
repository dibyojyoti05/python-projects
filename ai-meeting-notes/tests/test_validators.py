import pytest
from app.utils.validators import (
    validate_file_type,
    validate_file_size,
    validate_transcript_text,
)


def test_validate_file_type_supported():
    # Text types
    assert validate_file_type("notes.txt") == (True, "text", "")
    assert validate_file_type("doc.md") == (True, "text", "")
    assert validate_file_type("report.docx") == (True, "text", "")
    assert validate_file_type("slides.pdf") == (True, "text", "")

    # Audio types
    assert validate_file_type("recording.mp3") == (True, "audio", "")
    assert validate_file_type("audio.wav") == (True, "audio", "")
    assert validate_file_type("voice.m4a") == (True, "audio", "")

    # Video types
    assert validate_file_type("meeting.mp4") == (True, "video", "")
    assert validate_file_type("session.webm") == (True, "audio", "")  # webm is in audio set as well


def test_validate_file_type_unsupported():
    is_valid, category, err = validate_file_type("program.exe")
    assert not is_valid
    assert category == "unsupported"
    assert "Unsupported file extension" in err


def test_validate_file_size():
    # Valid size (5 MB)
    is_valid, err = validate_file_size(5 * 1024 * 1024, max_mb=100)
    assert is_valid
    assert err == ""

    # Zero byte file
    is_valid, err = validate_file_size(0, max_mb=100)
    assert not is_valid
    assert "empty" in err

    # Oversized file (150 MB)
    is_valid, err = validate_file_size(150 * 1024 * 1024, max_mb=100)
    assert not is_valid
    assert "exceeds maximum allowed limit" in err


def test_validate_transcript_text():
    # Valid transcript
    is_valid, err = validate_transcript_text("This is a sufficiently long meeting transcript with discussions.")
    assert is_valid
    assert err == ""

    # Empty text
    is_valid, err = validate_transcript_text("   ")
    assert not is_valid
    assert "empty" in err

    # Too short text
    is_valid, err = validate_transcript_text("Short text")
    assert not is_valid
    assert "too short" in err

