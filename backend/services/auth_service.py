from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from backend.models import User, SecurityEvent, AuthenticationEvent
from backend.extensions import db

def role_required(allowed_roles):
    """
    Decorator to enforce Role-Based Access Control (RBAC).
    Allowed roles can be a string or a list of strings (e.g. ['admin', 'analyst']).
    If unauthorized, returns HTTP 403 and logs a SecurityEvent in DB.
    """
    if isinstance(allowed_roles, str):
        allowed_roles = [allowed_roles]

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception as e:
                # Log unauthorized access attempt
                client_ip = request.remote_addr or '127.0.0.1'
                sec_event = SecurityEvent(
                    source_ip=client_ip,
                    event_type='UNAUTHORIZED_ACCESS_ATTEMPT',
                    severity='MEDIUM',
                    confidence=0.9,
                    action='BLOCK',
                    raw_data=f"Missing or invalid JWT token on path {request.path}",
                    status='ACTIVE'
                )
                db.session.add(sec_event)
                db.session.commit()
                return jsonify({
                    "error": "Unauthorized",
                    "message": "Valid authentication token is required"
                }), 401

            claims = get_jwt()
            user_role = claims.get('role', 'user')
            username = claims.get('username', 'unknown')

            if user_role not in allowed_roles:
                client_ip = request.remote_addr or '127.0.0.1'
                
                # Create Security Event for RBAC Failure
                sec_event = SecurityEvent(
                    source_ip=client_ip,
                    event_type='RBAC_AUTHORIZATION_FAILURE',
                    severity='HIGH',
                    confidence=0.95,
                    action='BLOCK',
                    raw_data=f"User '{username}' (role: {user_role}) attempted to access restricted endpoint {request.path} (Required: {allowed_roles})",
                    status='ACTIVE'
                )
                db.session.add(sec_event)
                db.session.commit()

                return jsonify({
                    "error": "Forbidden",
                    "message": f"Role '{user_role}' is not authorized to perform this operation. Required roles: {allowed_roles}"
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def log_auth_attempt(username: str, ip_address: str, success: bool, reason: str = None):
    """
    Log authentication events and create SecurityEvent on failure.
    """
    auth_event = AuthenticationEvent(
        username=username,
        ip_address=ip_address,
        success=success,
        reason=reason
    )
    db.session.add(auth_event)

    if not success:
        sec_event = SecurityEvent(
            source_ip=ip_address,
            event_type='AUTH_FAILURE',
            severity='MEDIUM',
            confidence=0.85,
            action='MONITOR',
            raw_data=f"Failed login attempt for user '{username}'. Reason: {reason}",
            status='ACTIVE'
        )
        db.session.add(sec_event)

    db.session.commit()
