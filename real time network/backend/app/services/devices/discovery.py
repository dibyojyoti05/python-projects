import asyncio
from typing import List, Dict, Any
import logging
from scapy.all import ARP, Ether, srp, conf

logger = logging.getLogger(__name__)
# Suppress scapy warnings
conf.verb = 0

class DeviceDiscovery:
    async def scan_network(self, ip_range: str = "192.168.1.0/24") -> List[Dict[str, Any]]:
        """
        Perform an ARP scan on the given IP range.
        Requires elevated privileges (Admin/Root).
        """
        devices = []
        try:
            # We use to_thread because srp is blocking
            answered, _ = await asyncio.to_thread(
                srp,
                Ether(dst="ff:ff:ff:ff:ff:ff") / ARP(pdst=ip_range),
                timeout=2,
                verbose=0
            )
            
            for sent, received in answered:
                devices.append({
                    "ip_address": received.psrc,
                    "mac_address": received.hwsrc,
                    "is_online": True,
                })
        except PermissionError:
            logger.warning("Permission denied for ARP scan. Run as Administrator.")
        except Exception as e:
            logger.error(f"ARP scan failed: {e}")
            
        return devices

discovery = DeviceDiscovery()
