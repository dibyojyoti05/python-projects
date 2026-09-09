import cv2
import numpy as np
import torch

# Fix for PyTorch 2.6+ weights_only default change with Ultralytics checkpoints
_orig_torch_load = torch.load
def _patched_torch_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _orig_torch_load(*args, **kwargs)
torch.load = _patched_torch_load

try:
    import ultralytics.nn.tasks
    if hasattr(torch.serialization, "add_safe_globals"):
        torch.serialization.add_safe_globals([ultralytics.nn.tasks.DetectionModel])
except Exception:
    pass

from ultralytics import YOLO

class VisionEngine:
    def __init__(self, model_path="yolov8n.pt", confidence_threshold=0.5):
        try:
            self.model = YOLO(model_path)
            self.model_loaded = True
        except Exception as e:
            print(f"Warning: YOLO model could not be initialized directly ({e}). Operating in resilient mode.")
            self.model = None
            self.model_loaded = False
        self.confidence_threshold = confidence_threshold
        
    def process_frame(self, frame: np.ndarray):
        """
        Process a single frame with YOLO tracking (ByteTrack by default).
        Returns the annotated frame and list of detections.
        """
        if not self.model_loaded or self.model is None:
            return frame, []

        try:
            results = self.model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                conf=self.confidence_threshold,
                verbose=False
            )
        except Exception:
            return frame, []
        
        detections = []
        annotated_frame = frame.copy()
        
        if results and len(results) > 0 and results[0].boxes and results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy().astype(int)
            track_ids = results[0].boxes.id.cpu().numpy().astype(int)
            confidences = results[0].boxes.conf.cpu().numpy()
            class_ids = results[0].boxes.cls.cpu().numpy().astype(int)
            names = results[0].names
            
            for box, track_id, conf, cls_id in zip(boxes, track_ids, confidences, class_ids):
                x1, y1, x2, y2 = box
                cls_name = names.get(cls_id, f"cls_{cls_id}") if isinstance(names, dict) else str(cls_id)
                label = f"#{track_id} {cls_name} {conf:.2f}"
                
                detections.append({
                    "tracking_id": f"TRK-{track_id}",
                    "object_class": cls_name,
                    "confidence": float(conf),
                    "bounding_box": f"{x1},{y1},{x2},{y2}"
                })
                
                # Draw bounding box and label
                cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 136), 2)
                cv2.putText(
                    annotated_frame,
                    label,
                    (x1, max(15, y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (0, 255, 136),
                    2
                )
                            
        return annotated_frame, detections

engine = VisionEngine()
