import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app
from backend.extensions import db
from backend.models import (
    User,
    ProtectedService,
    PolicyRule,
    SecurityEvent,
    BlockedSource,
    EndpointRotation,
    PolicyAction
)

def seed():
    app = create_app()
    with app.app_context():
        print("[*] Seeding IANSA Security Database...")
        db.create_all()

        # 1. Users
        if User.query.count() == 0:
            print("  -> Creating default role accounts...")
            admin = User(username='admin', role='admin')
            admin.set_password('admin123')

            analyst = User(username='analyst', role='analyst')
            analyst.set_password('analyst123')

            user = User(username='user', role='user')
            user.set_password('user123')

            db.session.add_all([admin, analyst, user])

        # 2. Protected Services
        if ProtectedService.query.count() == 0:
            print("  -> Creating protected network services...")
            services = [
                ProtectedService(
                    name="Web Server",
                    service_key="web_server",
                    port=8080,
                    status="ONLINE",
                    current_endpoint="service-91af32.internal",
                    default_endpoint="service-a.internal",
                    visibility="HIDDEN"
                ),
                ProtectedService(
                    name="Application Server",
                    service_key="app_server",
                    port=8081,
                    status="ONLINE",
                    current_endpoint="app-74c2e1.internal",
                    default_endpoint="app-main.internal",
                    visibility="PROTECTED"
                ),
                ProtectedService(
                    name="Protected Database",
                    service_key="database",
                    port=5432,
                    status="ONLINE",
                    current_endpoint="db-sub-90a.internal",
                    default_endpoint="db-master.internal",
                    visibility="HIDDEN"
                ),
                ProtectedService(
                    name="Authentication Gateway",
                    service_key="auth_gateway",
                    port=443,
                    status="ONLINE",
                    current_endpoint="auth-gateway.internal",
                    default_endpoint="auth-gateway.internal",
                    visibility="PUBLIC"
                )
            ]
            db.session.add_all(services)

        # 3. Policy Rules
        if PolicyRule.query.count() == 0:
            print("  -> Creating adaptive policy rules...")
            rules = [
                PolicyRule(
                    name="Reconnaissance Defense Rule",
                    condition_type="THREAT_SCORE_THRESHOLD",
                    threshold_score=50,
                    action="BLOCK",
                    description="Automatically blocks IP source when cumulative threat score reaches HIGH (50+)."
                ),
                PolicyRule(
                    name="Critical Threat Quarantine",
                    condition_type="THREAT_SCORE_THRESHOLD",
                    threshold_score=75,
                    action="QUARANTINE",
                    description="Triggers firewall block and dynamic endpoint adaptation when score reaches CRITICAL (75+)."
                ),
                PolicyRule(
                    name="Suspicious Traffic Rate Limit",
                    condition_type="THREAT_SCORE_THRESHOLD",
                    threshold_score=25,
                    action="RATE_LIMIT",
                    description="Applies strict rate limiting on MEDIUM risk probes (25-49 score)."
                )
            ]
            db.session.add_all(rules)

        # 4. Initial Sample Security Events
        if SecurityEvent.query.count() == 0:
            print("  -> Creating sample security events...")
            now = datetime.now(timezone.utc)
            events = [
                SecurityEvent(
                    timestamp=now - timedelta(minutes=45),
                    source_ip="10.10.10.15",
                    event_type="PORT_SCAN",
                    severity="HIGH",
                    confidence=0.94,
                    action="BLOCK",
                    raw_data="Suricata Alert: Nmap SYN Port Scan detected on interface eth0",
                    status="ACTIVE"
                ),
                SecurityEvent(
                    timestamp=now - timedelta(minutes=30),
                    source_ip="10.10.10.15",
                    event_type="RECONNAISSANCE",
                    severity="HIGH",
                    confidence=0.91,
                    action="BLOCK",
                    raw_data="Repeated directory fuzzing / admin panel discovery attempt",
                    status="ACTIVE"
                ),
                SecurityEvent(
                    timestamp=now - timedelta(minutes=15),
                    source_ip="192.168.1.105",
                    event_type="AUTH_FAILURE",
                    severity="MEDIUM",
                    confidence=0.85,
                    action="MONITOR",
                    raw_data="Failed login attempt for user 'admin' from unauthorized workstation",
                    status="ACTIVE"
                ),
                SecurityEvent(
                    timestamp=now - timedelta(minutes=5),
                    source_ip="10.10.10.15",
                    event_type="SUSPICIOUS_REQUEST",
                    severity="CRITICAL",
                    confidence=0.98,
                    action="QUARANTINE",
                    raw_data="Exploit payload signature detected in HTTP GET parameters",
                    status="ACTIVE"
                )
            ]
            db.session.add_all(events)

            # Sample Blocked Source
            blocked = BlockedSource(
                ip_address="10.10.10.15",
                reason="Policy Engine Action: QUARANTINE (Score: 85)",
                blocked_at=now - timedelta(minutes=5),
                is_active=True,
                block_type="SIMULATION"
            )
            db.session.add(blocked)

            # Sample Endpoint Rotation
            rotation = EndpointRotation(
                service_name="Web Server",
                previous_endpoint="service-a.internal",
                new_endpoint="service-91af32.internal",
                reason="High threat score (85) from 10.10.10.15: Port scan & reconnaissance detected",
                timestamp=now - timedelta(minutes=5),
                mode="SIMULATION"
            )
            db.session.add(rotation)

            # Sample Policy Action
            action = PolicyAction(
                timestamp=now - timedelta(minutes=5),
                source_ip="10.10.10.15",
                threat_score=85,
                action_taken="QUARANTINE",
                trigger_reason="Port scan activity detected (+40) | Repeated reconnaissance probes (+30) | High traffic frequency (+20)",
                status="EXECUTED"
            )
            db.session.add(action)

        db.session.commit()
        print("[+] Database successfully initialized and seeded!")

if __name__ == '__main__':
    seed()
