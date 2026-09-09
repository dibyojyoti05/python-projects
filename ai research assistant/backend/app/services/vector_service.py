import chromadb
from app.config import get_settings
from app.services.embedding_service import EmbeddingService
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        settings = get_settings()
        self.client = chromadb.PersistentClient(path=settings.chroma_path)
        self.embedding_service = EmbeddingService()

    def _get_or_create_collection(self, session_id: str):
        # Create a unique collection per research session
        return self.client.get_or_create_collection(name=f"research_{session_id}")

    def add_chunks(self, session_id: str, chunks: List[str], metadatas: List[Dict[str, Any]], ids: List[str]):
        """
        Embeds and adds text chunks to the vector database.
        """
        if not chunks:
            return
            
        collection = self._get_or_create_collection(session_id)
        embeddings = self.embedding_service.generate_embeddings(chunks)
        
        if embeddings:
            try:
                collection.add(
                    documents=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    ids=ids
                )
            except Exception as e:
                logger.error(f"Failed to add chunks to vector database: {e}")

    def search(self, session_id: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Searches the vector database for the most relevant chunks.
        """
        collection = self._get_or_create_collection(session_id)
        
        # We need the query embedding to search
        try:
            query_embedding = self.embedding_service.generate_embeddings([query])[0]
        except Exception as e:
            logger.error(f"Failed to embed query: {e}")
            return []

        try:
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            # Format results
            formatted_results = []
            if results and results['documents'] and len(results['documents'][0]) > 0:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "id": results['ids'][0][i],
                        "document": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i] if 'distances' in results else None
                    })
            return formatted_results
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
