from backend.services.policy_engine import PolicyEngine
from backend.models import SecurityEvent, BlockedSource
from backend.extensions import db

def test_threat_scoring_calculation(app):
    with app.app_context():
        # Score port scan
        score, reasons = PolicyEngine.calculate_threat_score('10.10.10.20', 'PORT_SCAN')
        assert score >= 40
        assert any('Port scan' in r for r in reasons)
        assert PolicyEngine.score_to_severity(score) in ['MEDIUM', 'HIGH']

def test_policy_evaluation_and_response(app):
    with app.app_context():
        sec_event1 = SecurityEvent(
            source_ip='10.10.10.20',
            event_type='PORT_SCAN',
            severity='HIGH',
            confidence=0.95,
            action='MONITOR'
        )
        sec_event2 = SecurityEvent(
            source_ip='10.10.10.20',
            event_type='RECONNAISSANCE',
            severity='HIGH',
            confidence=0.92,
            action='MONITOR'
        )
        db.session.add_all([sec_event1, sec_event2])
        db.session.commit()

        result = PolicyEngine.evaluate_and_respond('10.10.10.20', sec_event2)
        assert result['threat_score'] >= 50
        assert result['policy_action'] in ['BLOCK', 'QUARANTINE']

        # Verify block in DB
        blocked = BlockedSource.query.filter_by(ip_address='10.10.10.20', is_active=True).first()
        assert blocked is not None
