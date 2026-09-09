from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Library Management System"
    API_V1_STR: str = "/api/v1"
    
    SECRET_KEY: str = "library_management_super_secure_jwt_secret_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    DATABASE_URL: str = "postgresql+asyncpg://postgres:root@127.0.0.1:5433/library_db"
    SYNC_DATABASE_URL: str = "postgresql://postgres:root@127.0.0.1:5433/library_db"
    REDIS_URL: str = "redis://localhost:6379/0"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

