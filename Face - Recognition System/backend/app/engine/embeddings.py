import numpy as np
from typing import List, Tuple, Optional

def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return dot_product / (norm_v1 * norm_v2)

def match_face(target_embedding: List[float], known_embeddings: List[Tuple[str, List[float]]], threshold: float = 0.6) -> Optional[Tuple[str, float]]:
    best_match_id = None
    best_score = -1.0
    
    target_np = np.array(target_embedding)
    
    for user_id, known_emb in known_embeddings:
        known_np = np.array(known_emb)
        score = cosine_similarity(target_np, known_np)
        
        if score > best_score and score >= threshold:
            best_score = score
            best_match_id = user_id
            
    if best_match_id:
        return best_match_id, float(best_score)
    return None
