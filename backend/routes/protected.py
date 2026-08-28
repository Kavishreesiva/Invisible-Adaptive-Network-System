from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt
from backend.services.auth_service import role_required

protected_bp = Blueprint('protected', __name__, url_prefix='/api')

@protected_bp.route('/protected', methods=['GET'])
@role_required(['admin', 'analyst', 'user'])
def protected_access():
    claims = get_jwt()
    return jsonify({
        "status": "success",
        "message": "Access granted to protected service resource",
        "user": claims.get('username'),
        "role": claims.get('role'),
        "resource": "Protected Business Service Alpha"
    }), 200


@protected_bp.route('/admin', methods=['GET'])
@role_required(['admin'])
def admin_only_access():
    claims = get_jwt()
    return jsonify({
        "status": "success",
        "message": "Access granted to administrative portal",
        "user": claims.get('username'),
        "role": claims.get('role'),
        "system_control": "FULL_ADMINISTRATION"
    }), 200
