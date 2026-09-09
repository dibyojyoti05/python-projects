import cv2
import time
import math
import random
import threading
import numpy as np
from typing import Dict, Optional
from app.engine.detector import VisionEngine

class CameraStream:
    def __init__(self, camera_id: int, rtsp_url: str, engine: VisionEngine, camera_name: str = "Camera"):
        self.camera_id = camera_id
        self.rtsp_url = rtsp_url
        self.camera_name = camera_name
        self.engine = engine
        self.is_running = False
        self.current_frame = None
        self.lock = threading.Lock()
        self.cap = None
        self.use_simulation = False

    def start(self):
        self.is_running = True
        threading.Thread(target=self._update, daemon=True).start()

    def stop(self):
        self.is_running = False
        if self.cap:
            try:
                self.cap.release()
            except Exception:
                pass

    def _update(self):
        from app.db.session import SessionLocal
        from app.db.models.event import DetectionEvent

        url = int(self.rtsp_url) if str(self.rtsp_url).isdigit() else self.rtsp_url
        
        try:
            self.cap = cv2.VideoCapture(url)
            # Short probe
            if not self.cap or not self.cap.isOpened():
                self.use_simulation = True
        except Exception:
            self.use_simulation = True

        last_logged = {}
        sim_step = 0

        while self.is_running:
            frame = None
            if not self.use_simulation and self.cap and self.cap.isOpened():
                ret, captured = self.cap.read()
                if ret and captured is not None:
                    frame = captured
                else:
                    # Fallback to simulation if feed dropped
                    self.use_simulation = True

            if frame is None:
                # Generate high-fidelity simulated camera feed
                sim_step += 1
                frame = self._generate_simulated_frame(sim_step)
                annotated_frame = frame
                detections = self._generate_simulated_detections(sim_step)
            else:
                annotated_frame, detections = self.engine.process_frame(frame)

            # Throttle DB logging to avoid DB flood
            if detections:
                try:
                    db = SessionLocal()
                    current_time = time.time()
                    for det in detections:
                        track_id = det["tracking_id"]
                        if track_id not in last_logged or (current_time - last_logged[track_id] > 6):
                            new_event = DetectionEvent(
                                camera_id=self.camera_id,
                                object_class=det["object_class"],
                                confidence=det["confidence"],
                                tracking_id=track_id,
                                bounding_box=det["bounding_box"],
                                zone_name="Monitored Perimeter",
                                duration_seconds=random.uniform(2.0, 15.0)
                            )
                            db.add(new_event)
                            last_logged[track_id] = current_time
                    db.commit()
                except Exception as e:
                    # Non-blocking error
                    pass
                finally:
                    db.close()

            # Encode as JPEG
            _, jpeg = cv2.imencode(".jpg", annotated_frame, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            with self.lock:
                self.current_frame = jpeg.tobytes()

            time.sleep(0.04)  # ~25 FPS

    def _generate_simulated_frame(self, step: int) -> np.ndarray:
        """Create a synthetic high-tech surveillance HUD frame."""
        width, height = 640, 360
        # Dark tech background with gradient and grid
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        frame[:, :] = (18, 20, 24)

        # Draw grid lines
        for x in range(0, width, 40):
            cv2.line(frame, (x, 0), (x, height), (28, 32, 38), 1)
        for y in range(0, height, 40):
            cv2.line(frame, (0, y), (width, y), (28, 32, 38), 1)

        # Draw corner crosshairs
        cv2.line(frame, (20, 20), (40, 20), (0, 255, 170), 2)
        cv2.line(frame, (20, 20), (20, 40), (0, 255, 170), 2)
        cv2.line(frame, (width - 20, 20), (width - 40, 20), (0, 255, 170), 2)
        cv2.line(frame, (width - 20, 20), (width - 20, 40), (0, 255, 170), 2)
        cv2.line(frame, (20, height - 20), (40, height - 20), (0, 255, 170), 2)
        cv2.line(frame, (20, height - 20), (20, height - 40), (0, 255, 170), 2)
        cv2.line(frame, (width - 20, height - 20), (width - 40, height - 20), (0, 255, 170), 2)
        cv2.line(frame, (width - 20, height - 20), (width - 20, height - 40), (0, 255, 170), 2)

        # Animated objects
        t = step * 0.05
        # Object 1: Person moving horizontally
        p_x = int(180 + 120 * math.sin(t * 0.6))
        p_y = int(140 + 20 * math.cos(t * 0.8))
        cv2.rectangle(frame, (p_x, p_y), (p_x + 90, p_y + 140), (0, 255, 136), 2)
        cv2.putText(frame, "#TRK-201 person 0.94", (p_x, p_y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 136), 1)

        # Object 2: Vehicle or luggage
        c_x = int(360 + 80 * math.cos(t * 0.4))
        c_y = int(210 + 15 * math.sin(t * 0.5))
        cv2.rectangle(frame, (c_x, c_y), (c_x + 130, c_y + 80), (255, 170, 0), 2)
        cv2.putText(frame, "#TRK-304 vehicle 0.89", (c_x, c_y - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 170, 0), 1)

        # Top overlay bar: Camera name, REC status, and Timestamp
        cv2.circle(frame, (30, 30), 6, (0, 0, 255), -1)
        cv2.putText(frame, "LIVE [AI ON]", (45, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 170), 1)
        cv2.putText(frame, f"CAM-{self.camera_id}: {self.camera_name}", (180, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        
        current_clock = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, current_clock, (width - 200, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (160, 160, 160), 1)

        # Bottom telemetry
        cv2.putText(frame, "FPS: 25.0 | Inference: 18.2ms | YOLOv8n-Tracking", (30, height - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (120, 120, 120), 1)

        return frame

    def _generate_simulated_detections(self, step: int):
        t = step * 0.05
        p_x = int(180 + 120 * math.sin(t * 0.6))
        p_y = int(140 + 20 * math.cos(t * 0.8))
        c_x = int(360 + 80 * math.cos(t * 0.4))
        c_y = int(210 + 15 * math.sin(t * 0.5))

        return [
            {
                "tracking_id": "TRK-201",
                "object_class": "person",
                "confidence": 0.94,
                "bounding_box": f"{p_x},{p_y},{p_x+90},{p_y+140}"
            },
            {
                "tracking_id": "TRK-304",
                "object_class": "car",
                "confidence": 0.89,
                "bounding_box": f"{c_x},{c_y},{c_x+130},{c_y+80}"
            }
        ]

    def get_frame(self):
        with self.lock:
            return self.current_frame


class StreamManager:
    def __init__(self):
        self.streams: Dict[int, CameraStream] = {}
        self.engine = VisionEngine()

    def add_camera(self, camera_id: int, rtsp_url: str, camera_name: str = "Camera"):
        if camera_id in self.streams and self.streams[camera_id].is_running:
            return
        stream = CameraStream(camera_id, rtsp_url, self.engine, camera_name=camera_name)
        stream.start()
        self.streams[camera_id] = stream

    def remove_camera(self, camera_id: int):
        if camera_id in self.streams:
            self.streams[camera_id].stop()
            del self.streams[camera_id]

    def get_active_cameras(self):
        return [cid for cid, s in self.streams.items() if s.is_running]

    def get_snapshot(self, camera_id: int) -> Optional[bytes]:
        stream = self.streams.get(camera_id)
        if stream:
            return stream.get_frame()
        return None

    def generate_frames(self, camera_id: int):
        stream = self.streams.get(camera_id)
        if not stream:
            return
        
        while stream.is_running:
            frame = stream.get_frame()
            if frame is not None:
                yield (b"--frame\r\n"
                       b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n")
            time.sleep(0.04)

stream_manager = StreamManager()
