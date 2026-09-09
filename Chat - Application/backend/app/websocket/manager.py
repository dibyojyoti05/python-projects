import json
from typing import Dict, List, Any
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps user_id to list of active WebSockets (allows multiple devices/tabs)
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        await self.broadcast_presence(user_id, True)

    async def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                await self.broadcast_presence(user_id, False)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

    async def broadcast_presence(self, user_id: int, is_online: bool):
        # Ideally, we should only broadcast to users who have a conversation with this user
        # For simplicity in this demo, we can broadcast to all connected, but the frontend
        # should only care if it's someone they chat with.
        message = {
            "type": "presence:update",
            "payload": {
                "user_id": user_id,
                "is_online": is_online
            }
        }
        for u_id, connections in self.active_connections.items():
            if u_id != user_id:
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()
