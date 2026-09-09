import cv2
import numpy as np
from pyzbar.pyzbar import decode
from app.models.domain import User, AttendanceSession, AttendanceRecord
from sqlalchemy.orm import Session
from datetime import datetime
import base64

class AttendanceEngine:
    def __init__(self):
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.recognizer = cv2.face.LBPHFaceRecognizer_create()
        self.is_trained = False
        self.label_to_user_id = {}
        
    def train(self, users):
        faces = []
        labels = []
        for user in users:
            encoding = user.get_face_encoding()
            if encoding:
                for img_list in encoding:
                    img_np = np.array(img_list, dtype=np.uint8)
                    faces.append(img_np)
                    labels.append(user.id)
                    self.label_to_user_id[user.id] = user.id
                    
        if faces and labels:
            self.recognizer.train(faces, np.array(labels))
            self.is_trained = True

    def process_base64_frame(self, image_base64: str, session_id: int, db: Session):
        # Decode base64 to cv2 image
        encoded_data = image_base64.split(',')[1] if ',' in image_base64 else image_base64
        nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
        if not session or session.status != 'active':
            return {"status": "error", "message": "Session inactive or invalid"}
            
        results = []

        # 1. QR Code
        decoded_objects = decode(frame)
        for obj in decoded_objects:
            qr_data = obj.data.decode('utf-8')
            user = db.query(User).filter(User.qr_code_data == qr_data).first()
            if user:
                res = self.mark_attendance(session_id, user.id, 'qr', db)
                if res: results.append({"user": user.name, "method": "qr"})

        # 2. Face Recognition
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
        
        for (x, y, w, h) in faces:
            if self.is_trained:
                face_roi = gray[y:y+h, x:x+w]
                label, confidence = self.recognizer.predict(face_roi)
                
                if confidence < 80:
                    user_id = self.label_to_user_id.get(label)
                    if user_id:
                        user = db.query(User).filter(User.id == user_id).first()
                        if user:
                            res = self.mark_attendance(session_id, user.id, 'face', db)
                            if res: results.append({"user": user.name, "method": "face", "confidence": int(confidence)})

        return {"status": "success", "matches": results}

    def mark_attendance(self, session_id, user_id, method, db: Session):
        existing = db.query(AttendanceRecord).filter_by(session_id=session_id, student_id=user_id).first()
        if not existing:
            record = AttendanceRecord(session_id=session_id, student_id=user_id, method=method)
            db.add(record)
            db.commit()
            return True
        return False

cv_engine = AttendanceEngine()
