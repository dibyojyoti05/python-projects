import cv2
import numpy as np
from typing import List, Dict, Any, Optional

try:
    from insightface.app import FaceAnalysis
except ImportError:
    FaceAnalysis = None

class FaceRecognizer:
    def __init__(self, use_gpu: bool = False):
        self.use_gpu = use_gpu
        self.app = None
        if FaceAnalysis:
            self.app = FaceAnalysis(name='buffalo_l', providers=['CUDAExecutionProvider' if use_gpu else 'CPUExecutionProvider'])
            self.app.prepare(ctx_id=0 if use_gpu else -1, det_size=(640, 640))

    def detect_and_embed(self, image: np.ndarray) -> List[Dict[str, Any]]:
        if not self.app:
            return []
            
        faces = self.app.get(image)
        results = []
        for face in faces:
            results.append({
                "bbox": face.bbox.astype(int).tolist(),
                "kps": face.kps.tolist(),
                "embedding": face.embedding.tolist(),
                "det_score": float(face.det_score)
            })
        return results

recognizer = FaceRecognizer()
