import socket
import platform
import subprocess
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class NetworkDetector:
    _last_known_ip = None
    _last_change_time = None
    _history = []

    @staticmethod
    def get_all_host_ips():
        """
        Retrieves all IPv4 addresses assigned to active host network adapters.
        """
        ips = []
        try:
            hostname = socket.gethostname()
            _, _, ip_list = socket.gethostbyname_ex(hostname)
            ips = ip_list
        except Exception:
            pass

        # Fallback UDP socket check
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            primary_sock_ip = s.getsockname()[0]
            s.close()
            if primary_sock_ip not in ips and not primary_sock_ip.startswith("127."):
                ips.append(primary_sock_ip)
        except Exception:
            pass

        return ips

    @classmethod
    def get_primary_ip(cls):
        """
        Determines the main physical Wi-Fi or Ethernet LAN IPv4 address (preferring 192.168.x.x, 10.x.x.x).
        """
        all_ips = cls.get_all_host_ips()

        # 1. Prefer Wi-Fi / LAN IP (192.168.x.x or 10.x.x.x)
        for ip in all_ips:
            if ip.startswith("192.168.1.") or ip.startswith("192.168.0."):
                return ip

        for ip in all_ips:
            if ip.startswith("10."):
                return ip

        for ip in all_ips:
            if ip.startswith("192.168."):
                return ip

        for ip in all_ips:
            if not ip.startswith("127."):
                return ip

        return "127.0.0.1"

    @staticmethod
    def classify_network(ip):
        """
        Classifies network type based on IP subnet ranges.
        """
        if ip.startswith("127."):
            return "Loopback / Localhost", "LOCAL"
        elif ip.startswith("10."):
            return "College / Enterprise Network (10.0.0.0/8)", "ENTERPRISE_WIFI"
        elif ip.startswith("192.168."):
            return "PG / Home Wi-Fi Network (192.168.x.x)", "HOME_PG_WIFI"
        elif ip.startswith("172.16.") or ip.startswith("172.31."):
            return "Private Subnet / VPN (172.16.0.0/12)", "PRIVATE_WIFI"
        else:
            return f"Public / External Subnet ({ip})", "PUBLIC_NETWORK"

    @staticmethod
    def scan_listening_services():
        """
        Scans common local ports to report active system service exposure.
        """
        ports_to_check = [
            (5000, "IANSA Flask API Backend"),
            (5173, "IANSA React Vite Frontend"),
            (80, "HTTP Web Server"),
            (443, "HTTPS Gateway"),
            (22, "SSH Remote Shell"),
            (5432, "PostgreSQL Database"),
            (3306, "MySQL Database"),
            (8080, "Alt Web Proxy")
        ]

        open_services = []
        for port, service_name in ports_to_check:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(0.15)
            result = sock.connect_ex(('127.0.0.1', port))
            sock.close()

            if result == 0:
                open_services.append({
                    "port": port,
                    "service": service_name,
                    "status": "LISTENING",
                    "exposure": "PROTECTED_MESH" if port in [5000, 5173] else "LOCAL_LISTENING"
                })
        return open_services

    @classmethod
    def detect(cls, db_session=None):
        """
        Performs full live network environment detection & IP transition analysis.
        """
        now = datetime.now(timezone.utc)
        current_ip = cls.get_primary_ip()
        all_host_ips = cls.get_all_host_ips()
        network_name, network_type = cls.classify_network(current_ip)
        hostname = platform.node() or "Local Workstation"
        os_name = f"{platform.system()} {platform.release()}"

        ip_changed = False
        previous_ip = cls._last_known_ip

        if cls._last_known_ip is None:
            cls._last_known_ip = current_ip
            cls._last_change_time = now.isoformat()
            cls._history.append({
                "timestamp": now.isoformat(),
                "from_ip": "INITIAL_BOOT",
                "to_ip": current_ip,
                "network": network_name
            })
        elif cls._last_known_ip != current_ip:
            ip_changed = True
            previous_ip = cls._last_known_ip
            cls._last_known_ip = current_ip
            cls._last_change_time = now.isoformat()

            transition_entry = {
                "timestamp": now.isoformat(),
                "from_ip": previous_ip,
                "to_ip": current_ip,
                "network": network_name
            }
            cls._history.insert(0, transition_entry)

            # Log Security Event if DB session is available
            if db_session:
                try:
                    from backend.models import SecurityEvent
                    event = SecurityEvent(
                        timestamp=now,
                        source_ip=current_ip,
                        event_type="NETWORK_CHANGE",
                        severity="MEDIUM",
                        confidence=0.99,
                        action="MONITOR",
                        raw_data=f"Network Environment Transition: Switched from {previous_ip} to {current_ip} ({network_name})",
                        status="ACTIVE"
                    )
                    db_session.add(event)
                    db_session.commit()
                except Exception as e:
                    logger.error(f"Failed to log NETWORK_CHANGE event: {e}")

        open_services = cls.scan_listening_services()

        return {
            "status": "CONNECTED",
            "current_ip": current_ip,
            "all_host_ips": all_host_ips,
            "previous_ip": previous_ip or current_ip,
            "ip_changed": ip_changed,
            "network_name": network_name,
            "network_type": network_type,
            "hostname": hostname,
            "operating_system": os_name,
            "last_change_time": cls._last_change_time,
            "exposure_level": "NORMAL" if len(open_services) <= 4 else "HIGH_EXPOSURE",
            "open_services": open_services,
            "transition_history": cls._history[:10]
        }
