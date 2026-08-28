from flask import Blueprint, request, jsonify
from backend.models import ProtectedService
from backend.services.endpoint_adaptation import EndpointAdaptationService
from backend.services.auth_service import role_required

services_bp = Blueprint('services', __name__, url_prefix='/api')

@services_bp.route('/services', methods=['GET'])
def get_services():
    services = ProtectedService.query.all()
    rotations = EndpointAdaptationService.get_rotation_history(limit=20)
    return jsonify({
        "services": [s.to_dict() for s in services],
        "recent_rotations": rotations
    }), 200


@services_bp.route('/adaptations', methods=['GET'])
def get_adaptations():
    rotations = EndpointAdaptationService.get_rotation_history(limit=50)
    return jsonify(rotations), 200


@services_bp.route('/services/<int:service_id>/rotate', methods=['POST'])
@role_required(['admin'])
def rotate_service(service_id):
    service = ProtectedService.query.get_or_404(service_id)
    data = request.get_json() or {}
    reason = data.get('reason', 'Manual administrator trigger via SOC Dashboard')

    result = EndpointAdaptationService.rotate_service_endpoint(service.service_key, reason=reason)
    return jsonify({
        "message": f"Endpoint rotated for service {service.name}",
        "rotation": result
    }), 200


@services_bp.route('/admin/rotate-endpoint', methods=['POST'])
@role_required(['admin'])
def admin_rotate_endpoint():
    data = request.get_json() or {}
    service_key = data.get('service_key', 'web_server')
    reason = data.get('reason', 'Admin triggered endpoint adaptation')

    result = EndpointAdaptationService.rotate_service_endpoint(service_key, reason=reason)
    return jsonify({
        "message": "Endpoint adaptation executed successfully",
        "result": result
    }), 200
