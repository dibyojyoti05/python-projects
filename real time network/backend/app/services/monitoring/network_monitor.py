import psutil
import socket
import asyncio
from ping3 import ping
import time
from typing import Dict, Any, List

class NetworkMonitor:
    def __init__(self):
        self.last_io_counters = psutil.net_io_counters(pernic=True)
        self.last_time = time.time()
        
    def get_interfaces(self) -> List[Dict[str, Any]]:
        interfaces = []
        stats = psutil.net_if_stats()
        addrs = psutil.net_if_addrs()
        
        for name, stat in stats.items():
            if_addrs = addrs.get(name, [])
            mac = None
            ipv4 = None
            ipv6 = None
            for addr in if_addrs:
                if addr.family == psutil.AF_LINK:
                    mac = addr.address
                elif addr.family == socket.AF_INET:
                    ipv4 = addr.address
                elif addr.family == socket.AF_INET6:
                    ipv6 = addr.address
            
            interfaces.append({
                "name": name,
                "is_up": stat.isup,
                "speed_mbps": stat.speed,
                "mac_address": mac,
                "ipv4_address": ipv4,
                "ipv6_address": ipv6
            })
        return interfaces

    def get_traffic_metrics(self) -> Dict[str, Dict[str, float]]:
        current_time = time.time()
        current_io = psutil.net_io_counters(pernic=True)
        time_diff = current_time - self.last_time
        
        metrics = {}
        for name, io in current_io.items():
            last = self.last_io_counters.get(name)
            if last and time_diff > 0:
                bytes_sent_sec = (io.bytes_sent - last.bytes_sent) / time_diff
                bytes_recv_sec = (io.bytes_recv - last.bytes_recv) / time_diff
                packets_sent_sec = (io.packets_sent - last.packets_sent) / time_diff
                packets_recv_sec = (io.packets_recv - last.packets_recv) / time_diff
                
                metrics[name] = {
                    "bytes_sent": bytes_sent_sec,
                    "bytes_received": bytes_recv_sec,
                    "packets_sent": packets_sent_sec,
                    "packets_received": packets_recv_sec,
                    "errors_in": io.errin,
                    "errors_out": io.errout,
                    "drops_in": io.dropin,
                    "drops_out": io.dropout
                }
        
        self.last_io_counters = current_io
        self.last_time = current_time
        return metrics

    async def measure_latency(self, target: str = "8.8.8.8", count: int = 4) -> Dict[str, Any]:
        latencies = []
        for _ in range(count):
            try:
                # ping3 returns time in seconds, we want ms
                delay = await asyncio.to_thread(ping, target, timeout=2)
                if delay is not None:
                    latencies.append(delay * 1000)
            except Exception:
                pass
                
        if not latencies:
            return {"is_online": False, "latency_ms": None, "packet_loss_percent": 100.0}
            
        packet_loss = ((count - len(latencies)) / count) * 100
        avg_latency = sum(latencies) / len(latencies)
        
        return {
            "is_online": True,
            "latency_ms": avg_latency,
            "packet_loss_percent": packet_loss
        }

monitor = NetworkMonitor()
