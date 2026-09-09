from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone
import uuid
from typing import Optional

from app.models.network import Alert, Incident
from app.core.config import settings

class AlertEngine:
    async def evaluate_metrics(self, db: AsyncSession, metrics: dict):
        """
        Evaluates current metrics against thresholds and generates alerts if needed.
        """
        # Thresholds
        latency_threshold = settings.LATENCY_THRESHOLD
        packet_loss_threshold = settings.PACKET_LOSS_THRESHOLD

        latency = metrics.get("latency_ms")
        packet_loss = metrics.get("packet_loss_percent")
        is_online = metrics.get("is_online", True)

        await self._check_condition(db, "connectivity", not is_online, "Internet unreachable", "CRITICAL", None, 0)
        
        if is_online:
            if latency is not None:
                await self._check_condition(db, "latency", latency > latency_threshold, f"High latency detected: {latency:.1f}ms", "WARNING", latency, latency_threshold)
            
            if packet_loss is not None:
                await self._check_condition(db, "packet_loss", packet_loss > packet_loss_threshold, f"Packet loss detected: {packet_loss:.1f}%", "CRITICAL" if packet_loss > 10 else "WARNING", packet_loss, packet_loss_threshold)

    async def _check_condition(self, db: AsyncSession, alert_type: str, condition: bool, message: str, severity: str, metric_value: Optional[float], threshold: Optional[float]):
        # Find active alert of this type
        result = await db.execute(select(Alert).where(Alert.type == alert_type, Alert.status == "ACTIVE"))
        active_alert = result.scalars().first()

        if condition:
            if not active_alert:
                # Create new alert
                incident = await self._get_or_create_incident(db, message)
                new_alert = Alert(
                    type=alert_type,
                    severity=severity,
                    message=message,
                    metric_value=metric_value,
                    threshold=threshold,
                    incident_id=incident.id
                )
                db.add(new_alert)
        else:
            if active_alert:
                # Resolve alert
                active_alert.status = "RESOLVED"
                active_alert.resolved_at = datetime.now(timezone.utc)
                await self._check_incident_resolution(db, active_alert.incident_id)

    async def _get_or_create_incident(self, db: AsyncSession, impact: str) -> Incident:
        # Find ongoing incident
        result = await db.execute(select(Incident).where(Incident.status == "ONGOING"))
        incident = result.scalars().first()
        if not incident:
            incident = Incident(impact=impact)
            db.add(incident)
            await db.flush() # get ID
        return incident

    async def _check_incident_resolution(self, db: AsyncSession, incident_id: uuid.UUID):
        if not incident_id:
            return
        # If all alerts for this incident are resolved, resolve the incident
        result = await db.execute(select(Alert).where(Alert.incident_id == incident_id, Alert.status == "ACTIVE"))
        active_alerts = result.scalars().all()
        if not active_alerts:
            incident_result = await db.execute(select(Incident).where(Incident.id == incident_id))
            incident = incident_result.scalars().first()
            if incident:
                incident.status = "RESOLVED"
                incident.resolved_at = datetime.now(timezone.utc)

alert_engine = AlertEngine()
