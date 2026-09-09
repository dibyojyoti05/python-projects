from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    # Ollama Local AI Settings
    ollama_host: str = "http://localhost:11434"
    ollama_llm_model: str = "llama3.2:1b"
    ollama_embed_model: str = "nomic-embed-text"
    
    search_api_key: str = ""
    
    # Database
    database_url: str = "sqlite:///./research.db"
    chroma_path: str = "./chroma_db"
    
    # CORS
    frontend_url: str = "http://localhost:5173"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache()
def get_settings() -> Settings:
    return Settings()
