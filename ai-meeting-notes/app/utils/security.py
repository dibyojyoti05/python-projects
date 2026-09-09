import hashlib
import re
import unicodedata
from pathlib import Path
from typing import BinaryIO, Union


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent directory traversal or invalid characters.
    """
    # Normalize unicode
    filename = unicodedata.normalize("NFKD", filename).encode("ascii", "ignore").decode("ascii")
    # Strip dangerous characters
    filename = re.sub(r"[^\w\s\.-]", "", filename).strip()
    # Replace whitespace with underscore
    filename = re.sub(r"[\s]+", "_", filename)
    # Avoid empty filename or dots only
    if not filename or filename.startswith("."):
        filename = f"upload_{filename}"
    return filename[:200]  # Limit length


def compute_file_hash(file_input: Union[Path, str, BinaryIO, bytes]) -> str:
    """
    Compute SHA-256 hash of a file or byte stream for deduplication/caching.
    """
    hasher = hashlib.sha256()

    if isinstance(file_input, (str, Path)):
        path = Path(file_input)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {path}")
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                hasher.update(chunk)
    elif isinstance(file_input, bytes):
        hasher.update(file_input)
    elif hasattr(file_input, "read"):
        # Seek to start if possible
        if hasattr(file_input, "seek"):
            file_input.seek(0)
        for chunk in iter(lambda: file_input.read(65536), b""):
            hasher.update(chunk)
        if hasattr(file_input, "seek"):
            file_input.seek(0)
    else:
        raise ValueError("Unsupported input type for file hash calculation")

    return hasher.hexdigest()


def mask_secret(secret: str, visible_start: int = 4, visible_end: int = 4) -> str:
    """Mask sensitive string, leaving prefix and suffix visible."""
    if not secret:
        return "Not Set"
    if len(secret) <= visible_start + visible_end:
        return "••••••••"
    return f"{secret[:visible_start]}••••••••{secret[-visible_end:]}"

