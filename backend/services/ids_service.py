import json
import logging
from datetime import datetime, timezone
from backend.models import SecurityEvent
from backend.extensions import db

logger = logging.getLogger(__name__)

class IDSService:
    @staticmethod
    def parse_suricata_alert(raw_log: str) -> dict:
        """
        Parses a Suricata eve.json alert object or fast.log string line into standardized IANSA event.
        """
        try:
            if raw_log.strip().startswith('{'):
                data = json.loads(raw_log)
                if data.get('event_type') == 'alert':
                    alert = data.get('alert', {})
                    src_ip = data.get('src_ip', '10.10.10.15')
                    signature = alert.get('signature', 'Unknown Suricata Alert')
                    category = alert.get('category', 'Reconnaissance')
                    severity_num = alert.get('severity', 2)

                    # Map Suricata severity (1=High, 2=Medium, 3=Low)
                    severity_map = {1: 'HIGH', 2: 'MEDIUM', 3: 'LOW'}
                    severity = severity_map.get(severity_num, 'MEDIUM')

                    # Classify event type
                    event_type = 'RECONNAISSANCE'
                    if 'scan' in signature.lower() or 'nmap' in signature.lower():
                        event_type = 'PORT_SCAN'
                        severity = 'HIGH'
                    elif 'brute' in signature.lower() or 'auth' in signature.lower():
                        event_type = 'AUTH_FAILURE'

                    return {
                        "timestamp": data.get('timestamp', datetime.now(timezone.utc).isoformat()),
                        "source_ip": src_ip,
                        "event_type": event_type,
                        "severity": severity,
                        "confidence": 0.92,
                        "action": "BLOCK" if severity in ['HIGH', 'CRITICAL'] else "MONITOR",
                        "raw_data": f"Suricata Alert [{signature}] Category: {category}"
                    }
        except Exception as e:
            logger.error(f"Error parsing Suricata log: {e}")

        # Default fallback representation
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_ip": "10.10.10.15",
            "event_type": "RECONNAISSANCE",
            "severity": "HIGH",
            "confidence": 0.90,
            "action": "BLOCK",
            "raw_data": raw_log
        }

    @classmethod
    def ingest_suricata_event(cls, raw_log_or_dict) -> SecurityEvent:
        """
        Parses raw event and saves normalized SecurityEvent to DB.
        """
        if isinstance(raw_log_or_dict, str):
            event_data = cls.parse_suricata_alert(raw_log_or_dict)
        elif isinstance(raw_log_or_dict, dict):
            event_data = raw_log_or_dict
        else:
            raise ValueError("Invalid log format")

        sec_event = SecurityEvent(
            source_ip=event_data.get('source_ip', '10.10.10.15'),
            event_type=event_data.get('event_type', 'RECONNAISSANCE'),
            severity=event_data.get('severity', 'HIGH'),
            confidence=event_data.get('confidence', 0.90),
            action=event_data.get('action', 'BLOCK'),
            raw_data=event_data.get('raw_data', 'Suricata Ingested Event'),
            status='ACTIVE'
        )
        db.session.add(sec_event)
        db.session.commit()
        return sec_event
