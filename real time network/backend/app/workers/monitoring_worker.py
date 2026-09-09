import asyncio
from app.services.monitoring.network_monitor import monitor
from app.services.alerts.engine import alert_engine
from app.api.api_v1.endpoints.ws import manager
from app.db.session import AsyncSessionLocal
from app.models.network import NetworkMetric, NetworkInterface
from sqlalchemy.future import select
import json
import logging

logger = logging.getLogger(__name__)

async def collect_and_broadcast():
    while True:
        try:
            # 1. Run latency test
            latency_data = await monitor.measure_latency(count=2)
            
            # 2. Get interfaces & traffic
            interfaces = monitor.get_interfaces()
            traffic = monitor.get_traffic_metrics()

            # Broadcast over WS
            ws_data = {
                "type": "network_update",
                "latency_ms": latency_data.get("latency_ms"),
                "packet_loss_percent": latency_data.get("packet_loss_percent"),
                "is_online": latency_data.get("is_online"),
                "interfaces": traffic
            }
            await manager.broadcast(json.dumps(ws_data))

            # Store in DB & evaluate alerts
            async with AsyncSessionLocal() as db:
                # We'll just assume one primary interface for simple tracking, or track all
                # For this demo, let's just log the first active interface
                active_if = next((i for i in interfaces if i["is_up"]), None)
                if active_if:
                    # Get or create interface in DB
                    result = await db.execute(select(NetworkInterface).where(NetworkInterface.name == active_if["name"]))
                    db_if = result.scalars().first()
                    if not db_if:
                        db_if = NetworkInterface(
                            name=active_if["name"], 
                            is_up=True, 
                            mac_address=active_if.get("mac_address"),
                            ipv4_address=active_if.get("ipv4_address")
                        )
                        db.add(db_if)
                        await db.flush()

                    if_traffic = traffic.get(db_if.name, {})

                    # Store metric
                    metric = NetworkMetric(
                        interface_id=db_if.id,
                        latency_ms=latency_data.get("latency_ms"),
                        packet_loss_percent=latency_data.get("packet_loss_percent"),
                        is_online=latency_data.get("is_online"),
                        bytes_sent=if_traffic.get("bytes_sent", 0),
                        bytes_received=if_traffic.get("bytes_received", 0),
                        packets_sent=if_traffic.get("packets_sent", 0),
                        packets_received=if_traffic.get("packets_received", 0)
                    )
                    db.add(metric)
                    await db.commit()

                    # Evaluate alerts
                    metrics_to_eval = {
                        "latency_ms": latency_data.get("latency_ms"),
                        "packet_loss_percent": latency_data.get("packet_loss_percent"),
                        "is_online": latency_data.get("is_online")
                    }
                    await alert_engine.evaluate_metrics(db, metrics_to_eval)
                    await db.commit()
            
        except Exception as e:
            logger.error(f"Worker error: {e}")
            
        await asyncio.sleep(5)
