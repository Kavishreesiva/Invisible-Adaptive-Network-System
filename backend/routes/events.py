from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from backend.models import SecurityEvent
from backend.services.policy_engine import PolicyEngine

events_bp = Blueprint('events', __name__, url_prefix='/api')

@events_bp.route('/events', methods=['GET'])
def get_events():
    severity = request.args.get('severity')
    event_type = request.args.get('event_type')
    limit = request.args.get('limit', 50, type=int)

    query = SecurityEvent.query

    if severity and severity.upper() != 'ALL':
        query = query.filter(SecurityEvent.severity == severity.upper())

    if event_type and event_type.upper() != 'ALL':
        query = query.filter(SecurityEvent.event_type == event_type.upper())

    events = query.order_by(SecurityEvent.timestamp.desc()).limit(limit).all()
    return jsonify([e.to_dict() for e in events]), 200


@events_bp.route('/events/<int:event_id>', methods=['GET'])
def get_event_detail(event_id):
    event = SecurityEvent.query.get_or_404(event_id)
    return jsonify(event.to_dict()), 200


@events_bp.route('/threats', methods=['GET'])
def get_threats():
    """
    Returns threat analytics grouped by IP and timeframes.
    """
    timeframe = request.args.get('timeframe', '24H')
    hours_map = {'1H': 1, '6H': 6, '24H': 24, '7D': 168}
    hours = hours_map.get(timeframe.upper(), 24)

    start_time = datetime.now(timezone.utc) - timedelta(hours=hours)

    events = SecurityEvent.query.filter(SecurityEvent.timestamp >= start_time).all()

    # Group by IP
    ip_summary = {}
    for e in events:
        ip = e.source_ip
        if ip not in ip_summary:
            score, reasons = PolicyEngine.calculate_threat_score(ip)
            ip_summary[ip] = {
                "ip": ip,
                "threat_score": score,
                "severity": PolicyEngine.score_to_severity(score),
                "reasons": reasons,
                "event_count": 0,
                "last_event": e.timestamp.isoformat()
            }
        ip_summary[ip]["event_count"] += 1

    threat_list = sorted(ip_summary.values(), key=lambda x: x["threat_score"], reverse=True)
    return jsonify({
        "timeframe": timeframe,
        "threats": threat_list
    }), 200
