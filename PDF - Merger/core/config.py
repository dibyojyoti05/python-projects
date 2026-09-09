import os
import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "Enterprise PDF Management Suite"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Base paths
    ROOT_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = ROOT_DIR / "db"
    LOG_DIR: Path = ROOT_DIR / "logs"
    TEMP_DIR: Path = ROOT_DIR / "temp"

    # Database
    DATABASE_URL: str = f"sqlite:///{DATA_DIR}/pdf_suite.db"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

# Ensure directories exist
os.makedirs(Settings().DATA_DIR, exist_ok=True)
os.makedirs(Settings().LOG_DIR, exist_ok=True)
os.makedirs(Settings().TEMP_DIR, exist_ok=True)

settings = Settings()

def setup_logging():
    """Setup console and rotating file logging."""
    log_file = settings.LOG_DIR / "pdf_suite.log"
    log_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] (%(name)s:%(lineno)d) - %(message)s'
    )
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Clear existing handlers to avoid duplicates
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Console Handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(log_formatter)
    root_logger.addHandler(console_handler)

    # Rotating File Handler (10MB max, 5 backups)
    file_handler = RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8"
    )
    file_handler.setFormatter(log_formatter)
    root_logger.addHandler(file_handler)
    
    logging.getLogger("pdf_suite").info("Logging initialized with rotating file handler.")
