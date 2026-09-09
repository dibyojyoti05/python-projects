from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import cv2
import base64
import numpy as np

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_text(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/stream")
async def camera_stream_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Receive frame data from client or simulated source
            data = await websocket.receive_text()
            # Process with AI Engine here...
            await websocket.send_text("Processed frame data")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
