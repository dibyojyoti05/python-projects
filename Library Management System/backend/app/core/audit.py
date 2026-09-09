from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
from typing import Optional

async def log_audit_event(
    db: AsyncSession,
    action: str,
    resource_type: str,
    user_id: Optional[int] = None,
    resource_id: Optional[int] = None,
    details: Optional[str] = None
):
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details
        )
        db.add(log)
    except Exception as e:
        print(f"Error logging audit: {e}")
