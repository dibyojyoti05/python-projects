import numpy as np
from typing import List
import logging
import hashlib

logger = logging.getLogger(__name__)

_transformer_model = None
_model_attempted = False

class EmbeddingModel:
    @staticmethod
    def _get_model():
        global _transformer_model, _model_attempted
        if _transformer_model is None and not _model_attempted:
            _model_attempted = True
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading sentence-transformers 'all-MiniLM-L6-v2'...")
                _transformer_model = SentenceTransformer('all-MiniLM-L6-v2')
            except Exception as e:
                logger.warning(f"Could not load SentenceTransformer, using TF-IDF hashing fallback: {e}")
                _transformer_model = None
        return _transformer_model

    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """
        Generate 384-dimensional embedding vector for text using sentence-transformers,
        with deterministic hashing fallback if PyTorch/transformers is offline or loading.
        """
        if not text or not text.strip():
            return [0.0] * 384

        model = EmbeddingModel._get_model()
        if model is not None:
            try:
                emb = model.encode(text[:2000])
                if isinstance(emb, np.ndarray):
                    return emb.tolist()
                return list(emb)
            except Exception as e:
                logger.error(f"Error encoding with SentenceTransformer: {e}")

        # Deterministic feature-hash fallback (384 dims, L2 normalized)
        vector = np.zeros(384, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h % 384
            weight = 1.0 / (1.0 + np.log1p(i))
            vector[idx] += weight

        norm = np.linalg.norm(vector)
        if norm > 0:
            vector = vector / norm
        return vector.tolist()

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2:
            return 0.0
        a = np.array(vec1, dtype=np.float32)
        b = np.array(vec2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        similarity = float(np.dot(a, b) / (norm_a * norm_b))
        return max(0.0, min(1.0, similarity))
