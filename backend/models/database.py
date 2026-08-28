from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from backend.extensions import db

def utc_now():
    return datetime.now(timezone.utc)

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(32), nullable=False, default='user') # 'admin', 'analyst', 'user'
    created_at = db.Column(db.DateTime, default=utc_now)
    last_login = db.Column(db.DateTime, nullable=True)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class SecurityEvent(db.Model):
    __tablename__ = 'security_events'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=utc_now, index=True)
    source_ip = db.Column(db.String(45), nullable=False, index=True)
    event_type = db.Column(db.String(64), nullable=False) # e.g. RECONNAISSANCE, PORT_SCAN, AUTH_FAILURE, SUSPICIOUS_REQUEST
    severity = db.Column(db.String(20), nullable=False, default='LOW') # LOW, MEDIUM, HIGH, CRITICAL
    confidence = db.Column(db.Float, default=0.85)
    action = db.Column(db.String(32), default='MONITOR') # ALLOW, MONITOR, RATE_LIMIT, BLOCK, QUARANTINE, ROTATE_ENDPOINT
    raw_data = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(32), default='ACTIVE') # ACTIVE, MITIGATED, RESOLVED, IGNORED

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'source_ip': self.source_ip,
            'event_type': self.event_type,
            'severity': self.severity,
            'confidence': self.confidence,
            'action': self.action,
            'raw_data': self.raw_data,
            'status': self.status
        }


class AuthenticationEvent(db.Model):
    __tablename__ = 'authentication_events'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=utc_now, index=True)
    username = db.Column(db.String(64), nullable=True)
    ip_address = db.Column(db.String(45), nullable=False)
    success = db.Column(db.Boolean, nullable=False)
    reason = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'username': self.username,
            'ip_address': self.ip_address,
            'success': self.success,
            'reason': self.reason
        }


class PolicyRule(db.Model):
    __tablename__ = 'policy_rules'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False, unique=True)
    condition_type = db.Column(db.String(64), nullable=False) # e.g. THREAT_SCORE_THRESHOLD, REPEATED_AUTH_FAILURES
    threshold_score = db.Column(db.Integer, default=50)
    action = db.Column(db.String(32), nullable=False) # ALLOW, MONITOR, RATE_LIMIT, BLOCK, QUARANTINE, ROTATE_ENDPOINT
    is_active = db.Column(db.Boolean, default=True)
    description = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'condition_type': self.condition_type,
            'threshold_score': self.threshold_score,
            'action': self.action,
            'is_active': self.is_active,
            'description': self.description
        }


class PolicyAction(db.Model):
    __tablename__ = 'policy_actions'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=utc_now, index=True)
    source_ip = db.Column(db.String(45), nullable=False)
    threat_score = db.Column(db.Integer, nullable=False)
    action_taken = db.Column(db.String(32), nullable=False)
    trigger_reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(32), default='EXECUTED')

    def to_dict(self):
        return {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'source_ip': self.source_ip,
            'threat_score': self.threat_score,
            'action_taken': self.action_taken,
            'trigger_reason': self.trigger_reason,
            'status': self.status
        }


class BlockedSource(db.Model):
    __tablename__ = 'blocked_sources'

    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), unique=True, nullable=False, index=True)
    reason = db.Column(db.String(255), nullable=False)
    blocked_at = db.Column(db.DateTime, default=utc_now)
    expires_at = db.Column(db.DateTime, nullable=True) # None = permanent block
    is_active = db.Column(db.Boolean, default=True)
    block_type = db.Column(db.String(32), default='SIMULATION') # 'NFTABLES' or 'SIMULATION'

    def to_dict(self):
        return {
            'id': self.id,
            'ip_address': self.ip_address,
            'reason': self.reason,
            'blocked_at': self.blocked_at.isoformat() if self.blocked_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'block_type': self.block_type
        }


class EndpointRotation(db.Model):
    __tablename__ = 'endpoint_rotations'

    id = db.Column(db.Integer, primary_key=True)
    service_name = db.Column(db.String(64), nullable=False)
    previous_endpoint = db.Column(db.String(128), nullable=False)
    new_endpoint = db.Column(db.String(128), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=utc_now, index=True)
    triggered_event_id = db.Column(db.Integer, db.ForeignKey('security_events.id'), nullable=True)
    mode = db.Column(db.String(32), default='SIMULATION') # 'SIMULATION' or 'NETWORK'

    def to_dict(self):
        return {
            'id': self.id,
            'service_name': self.service_name,
            'previous_endpoint': self.previous_endpoint,
            'new_endpoint': self.new_endpoint,
            'reason': self.reason,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'triggered_event_id': self.triggered_event_id,
            'mode': self.mode
        }


class ProtectedService(db.Model):
    __tablename__ = 'protected_services'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), nullable=False, unique=True)
    service_key = db.Column(db.String(64), nullable=False, unique=True)
    port = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(32), default='ONLINE') # ONLINE, ACTIVE, WARNING, OFFLINE
    current_endpoint = db.Column(db.String(128), nullable=False)
    default_endpoint = db.Column(db.String(128), nullable=False)
    visibility = db.Column(db.String(32), default='HIDDEN') # HIDDEN, PROTECTED, PUBLIC
    last_event_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'service_key': self.service_key,
            'port': self.port,
            'status': self.status,
            'current_endpoint': self.current_endpoint,
            'default_endpoint': self.default_endpoint,
            'visibility': self.visibility,
            'last_event_at': self.last_event_at.isoformat() if self.last_event_at else None
        }


class AuditLog(db.Model):
    """Hash-chained immutable audit log. Each entry links to the previous
    entry via SHA-256, so tampering with any record breaks the chain."""
    __tablename__ = 'audit_log'

    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=utc_now, index=True)
    actor = db.Column(db.String(128), nullable=True)  # username or 'SYSTEM'
    action = db.Column(db.String(64), nullable=False, index=True)
    resource = db.Column(db.String(255), nullable=True)
    detail = db.Column(db.Text, nullable=True)
    prev_hash = db.Column(db.String(64), nullable=True)
    chain_hash = db.Column(db.String(64), nullable=False, unique=True, index=True)

    @staticmethod
    def compute_hash(timestamp: str, actor: str, action: str, resource: str, detail: str, prev_hash: str) -> str:
        import hashlib
        payload = "|".join([str(x) for x in [timestamp, actor, action, resource, detail, prev_hash]])
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def to_dict(self, with_hash: bool = False):
        data = {
            'id': self.id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'actor': self.actor,
            'action': self.action,
            'resource': self.resource,
            'detail': self.detail,
        }
        if with_hash:
            data['prev_hash'] = self.prev_hash
            data['chain_hash'] = self.chain_hash
        return data


class ProjectModule(db.Model):
    """Project implementation tracker module (IANSA)."""
    __tablename__ = 'project_modules'

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(64), nullable=False, unique=True, index=True)
    name = db.Column(db.String(128), nullable=False)
    description = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, default=0)

    tasks = db.relationship('ProjectTask', backref='module', cascade='all, delete-orphan', order_by='ProjectTask.order_index')

    def to_dict(self):
        return {
            'id': self.id,
            'key': self.key,
            'name': self.name,
            'description': self.description,
            'order_index': self.order_index
        }


class ProjectTask(db.Model):
    """Detailed task belonging to a tracker module."""
    __tablename__ = 'project_tasks'

    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('project_modules.id'), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    # IMPLEMENTED | PARTIAL | SIMULATED | NOT_IMPLEMENTED
    status = db.Column(db.String(32), nullable=False, default='NOT_IMPLEMENTED', index=True)
    # HIGH | MEDIUM | LOW
    priority = db.Column(db.String(16), default='MEDIUM')
    remarks = db.Column(db.Text, nullable=True)
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            'id': self.id,
            'module_id': self.module_id,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'priority': self.priority,
            'remarks': self.remarks,
            'order_index': self.order_index
        }
