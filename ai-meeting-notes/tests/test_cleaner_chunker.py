import pytest
from app.utils.text_cleaner import clean_transcript, estimate_word_count
from app.services.chunking_service import ChunkingService


def test_clean_transcript_normalizes_whitespace():
    raw = "  Hello   world!  \r\n\r\n\n\n  Speaker 1:   We have completed the   work.  \n"
    cleaned = clean_transcript(raw)
    assert "Hello world!" in cleaned
    assert "Speaker 1: We have completed the work." in cleaned
    assert "\r" not in cleaned
    assert "\n\n\n" not in cleaned


def test_estimate_word_count():
    assert estimate_word_count("One two three four five") == 5
    assert estimate_word_count("") == 0
    assert estimate_word_count("   ") == 0


def test_chunking_short_transcript():
    text = "Short transcript that does not exceed chunk size."
    chunks = ChunkingService.chunk_transcript(text, chunk_size=500, chunk_overlap=50)
    assert len(chunks) == 1
    assert chunks[0] == text


def test_chunking_long_transcript():
    lines = [f"[00:{i:02d}:00] Speaker {i%3}: This is discussion point number {i} with details." for i in range(1, 50)]
    long_text = "\n".join(lines)

    chunk_size = 300
    overlap = 50
    chunks = ChunkingService.chunk_transcript(long_text, chunk_size=chunk_size, chunk_overlap=overlap)

    assert len(chunks) > 1
    for c in chunks:
        assert len(c) > 0

    # Ensure all original lines appear somewhere in chunks
    for line in lines:
        found = any(line in c for c in chunks)
        assert found, f"Line missing from chunked output: {line}"

