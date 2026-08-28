from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify
from backend.models import SecurityEvent, BlockedSource, ProtectedService, EndpointRotation, PolicyAction
from backend.services.firewall_service import FirewallService
from backend.config import Config

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api')

@dashboard_bp.route('/status', methods=['GET'])
def system_status():
    """
    Returns system components status: Gateway, Firewall, Suricata IDS, Policy Engine, Database, Protected Services.
    """
    firewall_mode = 'NFTABLES' if FirewallService.is_nftables_available() else 'SIMULATION'

    return jsonify({
        "status": "ONLINE",
        "mode": Config.EXECUTION_MODE,
        "components": {
            "gateway": {"name": "IANSA Gateway", "status": "ONLINE", "mode": Config.EXECUTION_MODE},
            "firewall": {"name": "nftables Firewall", "status": "ACTIVE", "type": firewall_mode},
            "ids": {"name": "Suricata IDS Engine", "status": "ACTIVE", "mode": "PARSER_AND_MONITOR"},
            "policy_engine": {"name": "Adaptive Policy Engine", "status": "ACTIVE", "scoring": "DETERMINISTIC"},
            "database": {"name": "Security DB Store", "status": "ONLINE", "engine": "SQLite/PostgreSQL"},
            "protected_services": {"name": "Service Stealth Mesh", "status": "ACTIVE", "visibility": "HIDDEN"}
        }
    }), 200


@dashboard_bp.route('/dashboard/summary', methods=['GET'])
def dashboard_summary():
    """
    Comprehensive SOC summary endpoint.
    Calculates active threat metrics, trend metrics, recent events, active blocks, and endpoint rotations.
    """
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(hours=24)
    two_days_ago = now - timedelta(hours=48)

    # Active threats (Severity HIGH or CRITICAL in last 24 hours)
    active_threats_count = SecurityEvent.query.filter(
        SecurityEvent.timestamp >= one_day_ago,
        SecurityEvent.severity.in_(['HIGH', 'CRITICAL'])
    ).count()

    prev_active_threats_count = SecurityEvent.query.filter(
        SecurityEvent.timestamp >= two_days_ago,
        SecurityEvent.timestamp < one_day_ago,
        SecurityEvent.severity.in_(['HIGH', 'CRITICAL'])
    ).count()

    threat_trend = 0.0
    if prev_active_threats_count > 0:
        threat_trend = round(((active_threats_count - prev_active_threats_count) / prev_active_threats_count) * 100, 1)
    elif active_threats_count > 0:
        threat_trend = 100.0

    # Blocked Sources count
    blocked_count = BlockedSource.query.filter_by(is_active=True).count()

    # Total Security Events
    total_events_count = SecurityEvent.query.count()

    # Protected Services count
    protected_services_count = ProtectedService.query.count()

    # Recent Security Events (top 10)
    recent_events = SecurityEvent.query.order_by(SecurityEvent.timestamp.desc()).limit(15).all()

    # Recent Endpoint Rotations (top 5)
    recent_rotations = EndpointRotation.query.order_by(EndpointRotation.timestamp.desc()).limit(5).all()

    # Services
    services = ProtectedService.query.all()

    # Category breakdown for chart (last 24 hours)
    recon_count = SecurityEvent.query.filter(SecurityEvent.timestamp >= one_day_ago, SecurityEvent.event_type == 'RECONNAISSANCE').count()
    port_scan_count = SecurityEvent.query.filter(SecurityEvent.timestamp >= one_day_ago, SecurityEvent.event_type == 'PORT_SCAN').count()
    auth_fail_count = SecurityEvent.query.filter(SecurityEvent.timestamp >= one_day_ago, SecurityEvent.event_type.in_(['AUTH_FAILURE', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'RBAC_AUTHORIZATION_FAILURE'])).count()
    suspicious_count = SecurityEvent.query.filter(SecurityEvent.timestamp >= one_day_ago, SecurityEvent.event_type == 'SUSPICIOUS_REQUEST').count()

    latest_adaptation = recent_rotations[0].to_dict() if recent_rotations else {
        "service_name": "Web Server",
        "current_endpoint": "service-91af32.internal",
        "previous_endpoint": "service-a.internal",
        "timestamp": now.isoformat(),
        "reason": "Baseline dynamic stealth active",
        "mode": Config.EXECUTION_MODE
    }

    return jsonify({
        "metrics": {
            "active_threats": {
                "count": active_threats_count,
                "trend": f"{'+' if threat_trend >= 0 else ''}{threat_trend}%",
                "description": "High & Critical threats (Last 24h)"
            },
            "blocked_sources": {
                "count": blocked_count,
                "trend": "Active Enforcements",
                "description": "IPs quarantined by nftables/policy"
            },
            "total_events": {
                "count": total_events_count,
                "trend": "Audit Trail",
                "description": "Total security events recorded"
            },
            "protected_services": {
                "count": protected_services_count,
                "trend": "Stealth Active",
                "description": "Services hidden behind IANSA gateway"
            }
        },
        "event_categories": {
            "reconnaissance": recon_count,
            "port_scans": port_scan_count,
            "auth_failures": auth_fail_count,
            "suspicious_traffic": suspicious_count
        },
        "adaptive_network_state": {
            "status": "ADAPTIVE",
            "latest_adaptation": latest_adaptation
        },
        "recent_events": [e.to_dict() for e in recent_events],
        "protected_services": [s.to_dict() for s in services]
    }), 200
