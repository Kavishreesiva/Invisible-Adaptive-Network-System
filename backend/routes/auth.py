from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from backend.models import User
from backend.extensions import db
from backend.services.auth_service import log_auth_attempt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    ip_address = request.remote_addr or '127.0.0.1'

    if not username or not password:
        log_auth_attempt(username, ip_address, False, "Missing username or password")
        return jsonify({"error": "Bad Request", "message": "Username and password required"}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        log_auth_attempt(username, ip_address, False, "Invalid credentials")
        return jsonify({"error": "Unauthorized", "message": "Invalid username or password"}), 401

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.session.commit()

    log_auth_attempt(username, ip_address, True, "Authentication successful")

    # Generate JWT with custom claims (role, username)
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            'role': user.role,
            'username': user.username
        }
    )

    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    # In stateless JWT, logout can be recorded or handled client-side
    return jsonify({"message": "Logout successful"}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({"error": "Not Found", "message": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200
