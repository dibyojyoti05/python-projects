import re
import unicodedata


def clean_transcript(text: str) -> str:
    """
    Cleans transcript text:
    - Normalizes line breaks
    - Removes unnecessary non-printable chars
    - Normalizes whitespace without erasing paragraph breaks or speaker labels
    - Preserves timestamps (e.g., [00:14:20], 00:01:23)
    - Preserves speaker tags (e.g., "Rahul: ...", "Speaker 1: ...")
    """
    if not text:
        return ""

    # Normalize unicode
    text = unicodedata.normalize("NFKC", text)

    # Normalize Windows and Mac line breaks to Unix \n
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Remove null bytes or control characters except tabs and newlines
    text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or unicodedata.category(ch)[0] != "C")

    # Replace multiple consecutive spaces or tabs on a single line with a single space
    lines = []
    for line in text.split("\n"):
        cleaned_line = re.sub(r"[ \t]+", " ", line).strip()
        lines.append(cleaned_line)

    # Replace 3 or more consecutive blank lines with a single blank line
    cleaned_text = "\n".join(lines)
    cleaned_text = re.sub(r"\n{3,}", "\n\n", cleaned_text)

    return cleaned_text.strip()


def estimate_word_count(text: str) -> int:
    """Calculates approximate word count."""
    if not text:
        return 0
    return len(text.strip().split())

