import logging
from datetime import datetime, timedelta, timezone
from backend.models import SecurityEvent, PolicyRule, PolicyAction
from backend.extensions import db
from backend.services.firewall_service import FirewallService
from backend.services.endpoint_adaptation import EndpointAdaptationService

logger = logging.getLogger(__name__)

class PolicyEngine:
    """
    Intelligent Adaptive Policy Engine & Deterministic Threat Scoring Model.
    """

    @classmethod
    def calculate_threat_score(cls, source_ip: str, current_event_type: str = None) -> tuple[int, list[str]]:
        """
        Calculates deterministic threat score (0-100) based on historical and current events for an IP.
        Returns: (score, list_of_reasons)
        """
        score = 0
        reasons = []

        # Check events in the last 1 hour window
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_events = SecurityEvent.query.filter(
            SecurityEvent.source_ip == source_ip,
            SecurityEvent.timestamp >= one_hour_ago
        ).all()

        # Count event types
        port_scan_count = sum(1 for e in recent_events if e.event_type == 'PORT_SCAN')
        auth_fail_count = sum(1 for e in recent_events if e.event_type in ['AUTH_FAILURE', 'UNAUTHORIZED_ACCESS_ATTEMPT', 'RBAC_AUTHORIZATION_FAILURE'])
        recon_count = sum(1 for e in recent_events if e.event_type == 'RECONNAISSANCE')
        malicious_count = sum(1 for e in recent_events if e.severity == 'CRITICAL')
        total_requests = len(recent_events)

        # Factor 1: Repeated requests (+20)
        if total_requests > 5:
            score += 20
            reasons.append(f"High traffic frequency ({total_requests} recent requests) [+20]")

        # Factor 2: Port scan detection (+40)
        if port_scan_count > 0 or current_event_type == 'PORT_SCAN':
            score += 40
            reasons.append(f"Port scan activity detected ({max(1, port_scan_count)} times) [+40]")

        # Factor 3: Authentication failures (+15 per failure up to 30)
        if auth_fail_count > 0:
            add_score = min(30, auth_fail_count * 15)
            score += add_score
            reasons.append(f"Authentication/RBAC failures ({auth_fail_count} attempts) [+{add_score}]")

        # Factor 4: Known malicious / critical event (+50)
        if malicious_count > 0 or current_event_type == 'MALICIOUS_TRAFFIC':
            score += 50
            reasons.append("Known malicious signature / critical attack vector [+50]")

        # Factor 5: Repeated reconnaissance (+30)
        if recon_count > 1 or (recon_count == 1 and current_event_type == 'RECONNAISSANCE'):
            score += 30
            reasons.append(f"Repeated reconnaissance probes ({recon_count} events) [+30]")

        # Cap score at 100
        score = min(100, score)
        return score, reasons

    @classmethod
    def score_to_severity(cls, score: int) -> str:
        if score >= 75:
            return 'CRITICAL'
        elif score >= 50:
            return 'HIGH'
        elif score >= 25:
            return 'MEDIUM'
        else:
            return 'LOW'

    @classmethod
    def evaluate_and_respond(cls, source_ip: str, security_event: SecurityEvent = None) -> dict:
        """
        Evaluates threat score, maps to policy action, executes defensive response,
        and logs PolicyAction.
        """
        event_type = security_event.event_type if security_event else None
        threat_score, score_reasons = cls.calculate_threat_score(source_ip, event_type)
        severity = cls.score_to_severity(threat_score)
        
        reason_str = " | ".join(score_reasons) if score_reasons else "Normal baseline traffic"

        # Determine Policy Action based on Score Thresholds
        if threat_score >= 75: # CRITICAL
            action_taken = 'QUARANTINE' # BLOCK + ROTATE_ENDPOINT
        elif threat_score >= 50: # HIGH
            action_taken = 'BLOCK'
        elif threat_score >= 25: # MEDIUM
            action_taken = 'RATE_LIMIT'
        else: # LOW
            action_taken = 'ALLOW'

        # Check custom DB PolicyRules if active
        active_rules = PolicyRule.query.filter_by(is_active=True).order_by(PolicyRule.threshold_score.desc()).all()
        for rule in active_rules:
            if rule.condition_type == 'THREAT_SCORE_THRESHOLD' and threat_score >= rule.threshold_score:
                action_taken = rule.action
                reason_str += f" (Matched Rule: {rule.name})"
                break

        # Execute Defensive Response
        firewall_result = None
        rotation_result = None

        if action_taken in ['BLOCK', 'QUARANTINE']:
            firewall_result = FirewallService.block_ip(
                source_ip,
                reason=f"Policy Engine Action: {action_taken} (Score: {threat_score})"
            )

        if action_taken in ['QUARANTINE', 'ROTATE_ENDPOINT']:
            # Automatically trigger dynamic endpoint adaptation for protected services
            rotation_result = EndpointAdaptationService.rotate_service_endpoint(
                service_key='web_server',
                reason=f"High threat score ({threat_score}) from {source_ip}: {reason_str}",
                triggered_event_id=security_event.id if security_event else None
            )

        # Record Policy Action Audit Entry
        policy_action = PolicyAction(
            source_ip=source_ip,
            threat_score=threat_score,
            action_taken=action_taken,
            trigger_reason=reason_str,
            status='EXECUTED'
        )
        db.session.add(policy_action)

        if security_event:
            security_event.severity = severity
            security_event.action = action_taken

        db.session.commit()

        return {
            "source_ip": source_ip,
            "threat_score": threat_score,
            "severity": severity,
            "reasons": score_reasons,
            "policy_action": action_taken,
            "firewall_result": firewall_result,
            "rotation_result": rotation_result
        }
