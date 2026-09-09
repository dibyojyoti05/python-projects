from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # App config
    APP_ENV: str = "development"
    SECRET_KEY: str = "supersecretkey-change-me-in-production"
    JWT_SECRET: str = "supersecretjwt-change-me-in-production"
    
    # Database config
    DATABASE_URL: str = "postgresql+asyncpg://networkpulse:networkpulse123@localhost:5432/networkpulse"
    
    # Redis config
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Monitoring config
    MONITORING_INTERVAL: int = 5
    LATENCY_THRESHOLD: int = 100
    PACKET_LOSS_THRESHOLD: int = 3
    DATA_RETENTION_DAYS: int = 30
    
    # AI config
    AI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
