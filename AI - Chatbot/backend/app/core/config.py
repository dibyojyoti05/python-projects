import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE = BASE_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise AI Assistant"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    POSTGRES_SERVER: str = "127.0.0.1"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "root"
    POSTGRES_DB: str = "AI-Chatbot"
    POSTGRES_PORT: int = 5433
    DATABASE_URL: Optional[str] = None
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if not self.POSTGRES_SERVER:
            return "sqlite+aiosqlite:///./ai_chatbot.db"
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Security
    SECRET_KEY: str = "supersecretkey_for_testing"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    
    # Redis
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    
    # AI / LLM
    DEFAULT_MODEL: str = "gemini/gemini-3.6-flash"
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=(str(ENV_FILE), ".env"),
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

# Automatically sync Gemini / Google keys to environment for LiteLLM
os.environ["LITELLM_LOCAL_MODEL_COST_MAP"] = "True"
if settings.GEMINI_API_KEY and "GEMINI_API_KEY" not in os.environ:
    os.environ["GEMINI_API_KEY"] = settings.GEMINI_API_KEY
if settings.GOOGLE_API_KEY and "GOOGLE_API_KEY" not in os.environ:
    os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY

