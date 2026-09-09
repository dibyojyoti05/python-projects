from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.domain import User
from app.schemas.domain import FramePayload, UserResponse
from app.api.dependencies import get_current_user
import base64
import numpy as np
import cv2

router = APIRouter()

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

@router.post("/enroll-face", response_model=UserResponse)
def enroll_face(payload: FramePayload, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    encoded_data = payload.image_base64.split(',')[1] if ',' in payload.image_base64 else payload.image_base64
    nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
    
    if len(faces) == 0:
        raise HTTPException(status_code=400, detail="No face detected in the image.")
    if len(faces) > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please ensure only one face is visible.")
        
    (x, y, w, h) = faces[0]
    face_roi = gray[y:y+h, x:x+w]
    
    # Store the face image as a 2D list (simplification for the LBPH trainer)
    current_encoding = current_user.get_face_encoding() or []
    current_encoding.append(face_roi.tolist())
    
    current_user.set_face_encoding(current_encoding)
    db.commit()
    db.refresh(current_user)
    
    return current_user
