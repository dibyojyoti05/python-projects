import os
from pathlib import Path
from typing import Optional, Union, Any
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Ensure .env is loaded
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings(BaseSettings):
    """Centralized application settings loaded from environment variables and .env file."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # App Environment
    APP_ENV: str = Field(default="development")
    DEBUG: Union[bool, str] = Field(default=True)
    APP_TITLE: str = Field(default="AI Meeting Notes Summarizer")

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./meeting_notes.db")

    # AI Configuration
    AI_PROVIDER: str = Field(default="gemini")  # "gemini" or "mock"
    GEMINI_API_KEY: Optional[str] = Field(default=None)
    GEMINI_MODEL: str = Field(default="gemini-1.5-flash")

    # Transcription Configuration
    TRANSCRIPTION_PROVIDER: str = Field(default="mock")  # "whisper" or "mock"
    WHISPER_API_KEY: Optional[str] = Field(default=None)
    OPENAI_API_BASE: str = Field(default="https://api.openai.com/v1")

    # File & Directory Paths
    BASE_DIR: Path = BASE_DIR
    UPLOAD_DIR: Path = Field(default=BASE_DIR / "uploads")
    EXPORT_DIR: Path = Field(default=BASE_DIR / "exports")
    LOG_DIR: Path = Field(default=BASE_DIR / "logs")

    # Limits & Thresholds
    MAX_FILE_SIZE_MB: int = Field(default=100)
    MAX_TRANSCRIPT_LENGTH: int = Field(default=50000)
    CHUNK_SIZE: int = Field(default=4000)
    CHUNK_OVERLAP: int = Field(default=400)

    # Logging
    LOG_LEVEL: str = Field(default="INFO")

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v: Any) -> bool:
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "debug", "dev", "development")
        return bool(v)

    def ensure_directories(self) -> None:
        """Create necessary directories if they do not exist."""
        for path in [self.UPLOAD_DIR, self.EXPORT_DIR, self.LOG_DIR]:
            path.mkdir(parents=True, exist_ok=True)

    @property
    def is_gemini_ready(self) -> bool:
        return bool(self.GEMINI_API_KEY and len(self.GEMINI_API_KEY.strip()) > 5)

    @property
    def is_whisper_ready(self) -> bool:
        return bool(self.WHISPER_API_KEY and len(self.WHISPER_API_KEY.strip()) > 5)


# Global settings instance
settings = Settings()
settings.ensure_directories()

