import logging
import re
import sys
from pathlib import Path
from typing import Optional
from app.config.settings import settings


class RedactingFormatter(logging.Formatter):
    """Logging formatter that redacts sensitive API keys and secrets."""

    PATTERNS = [
        re.compile(r"AIza[0-9A-Za-z-_]{35}"),              # Google API Key
        re.compile(r"sk-[a-zA-Z0-9]{20,64}"),               # OpenAI / Whisper API Key
        re.compile(r"bearer\s+[a-zA-Z0-9\._\-]+", re.I),    # Bearer Tokens
        re.compile(r"(api[-_]?key|secret|password)=([^\s&]+)", re.I),
    ]

    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        redacted = original
        for pattern in self.PATTERNS:
            redacted = pattern.sub("[REDACTED_SECRET]", redacted)
        return redacted


def setup_logger(name: str = "meeting_summarizer", log_file: Optional[Path] = None) -> logging.Logger:
    """Sets up a sanitized, configured logger."""
    logger = logging.getLogger(name)
    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(level)

    if not logger.handlers:
        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        fmt = "%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
        console_formatter = RedactingFormatter(fmt)
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)

        # File Handler
        if log_file is None:
            settings.LOG_DIR.mkdir(parents=True, exist_ok=True)
            log_file = settings.LOG_DIR / "app.log"

        try:
            file_handler = logging.FileHandler(str(log_file), encoding="utf-8")
            file_handler.setLevel(level)
            file_formatter = RedactingFormatter(fmt)
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            sys.stderr.write(f"Failed to initialize file logger: {e}\n")

    return logger


# Global application logger
logger = setup_logger()

