from flask import Blueprint, request, jsonify
from backend.services.ids_service import IDSService
from backend.services.policy_engine import PolicyEngine
from backend.models import SecurityEvent

simulation_bp = Blueprint('simulation', __name__, url_prefix='/api/simulation')

@simulation_bp.route('/trigger-attack', methods=['POST'])
def trigger_attack_simulation():
    """
    Lab testing endpoint to simulate attack traffic (Port scan, auth failure, reconnaissance probe).
    Executes the full pipeline:
    DETECT -> ANALYZE -> DECIDE -> ADAPT -> AUDIT -> DISPLAY
    """
    data = request.get_json() or {}
    attack_type = data.get('attack_type', 'PORT_SCAN').upper()
    source_ip = data.get('source_ip', '10.10.10.15')

    event_map = {
        'PORT_SCAN': {
            'event_type': 'PORT_SCAN',
            'severity': 'HIGH',
            'confidence': 0.95,
            'raw_data': f"Simulated Nmap SYN Port Scan targeting gateway ports 1-1024 from {source_ip}"
        },
        'AUTH_BRUTE_FORCE': {
            'event_type': 'AUTH_FAILURE',
            'severity': 'MEDIUM',
            'confidence': 0.88,
            'raw_data': f"Simulated SSH/HTTP brute-force dictionary login attempt from {source_ip}"
        },
        'RECONNAISSANCE': {
            'event_type': 'RECONNAISSANCE',
            'severity': 'HIGH',
            'confidence': 0.92,
            'raw_data': f"Simulated stealth service probe and directory fuzzing from {source_ip}"
        },
        'MALICIOUS_REQUEST': {
            'event_type': 'SUSPICIOUS_REQUEST',
            'severity': 'CRITICAL',
            'confidence': 0.98,
            'raw_data': f"Simulated SQL injection / exploit payload detected in URI from {source_ip}"
        }
    }

    event_info = event_map.get(attack_type, event_map['PORT_SCAN'])

    # 1. Ingest Security Event (DETECT)
    sec_event = IDSService.ingest_suricata_event({
        "source_ip": source_ip,
        "event_type": event_info['event_type'],
        "severity": event_info['severity'],
        "confidence": event_info['confidence'],
        "action": "MONITOR",
        "raw_data": event_info['raw_data']
    })

    # 2. Evaluate Policy & Threat Score (ANALYZE & DECIDE & ADAPT)
    response_pipeline = PolicyEngine.evaluate_and_respond(source_ip, sec_event)

    return jsonify({
        "status": "SIMULATION_EXECUTED",
        "message": f"Simulated attack '{attack_type}' processed through IANSA security pipeline.",
        "event": sec_event.to_dict(),
        "pipeline_result": response_pipeline
    }), 200
