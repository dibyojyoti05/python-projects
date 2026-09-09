from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, EmailStr, validator
from typing import List, Union, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "MAILMIND"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Database
    DATABASE_URL: str
    SYNC_DATABASE_URL: str
    
    # AI Provider
    GEMINI_API_KEY: Optional[str] = None
    
    # Redis/Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
