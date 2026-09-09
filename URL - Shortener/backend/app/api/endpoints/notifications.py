import uuid
import json
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.user import User
from app.models.notification import Notification

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps user_id -> List of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """
    WebSocket endpoint for real-time notifications.
    In a real production app, you'd validate a token passed in the query string 
    or subprotocols to ensure the user_id belongs to the authenticated user.
    """
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep connection alive, listen for ping or explicit close
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)

@router.get("/")
async def get_notifications(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get user's past notifications
    """
    query = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return notifications

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Mark a notification as read
    """
    query = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    result = await db.execute(query)
    notification = result.scalars().first()
    
    if notification:
        notification.is_read = True
        await db.commit()
    
    return {"status": "ok"}

async def create_and_push_notification(user_id: uuid.UUID, title: str, message: str, db: AsyncSession):
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        is_read=False
    )
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    
    await manager.send_personal_message({
        "id": str(notif.id),
        "title": notif.title,
        "message": notif.message,
        "is_read": notif.is_read,
        "created_at": str(notif.created_at) if hasattr(notif, 'created_at') else ""
    }, str(user_id))
    return notif

