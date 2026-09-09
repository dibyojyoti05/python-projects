import logging
import ollama
from app.config import get_settings
from typing import List

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        self.settings = get_settings()
        self.host = self.settings.ollama_host
        self.model_name = self.settings.ollama_embed_model
        self.client = ollama.Client(host=self.host)

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generates embeddings for a list of text chunks.
        """
        if not texts:
            return []
            
        try:
            embeddings = []
            for text in texts:
                response = self.client.embeddings(
                    model=self.model_name,
                    prompt=text
                )
                embeddings.append(response['embedding'])
            return embeddings
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
            return []
