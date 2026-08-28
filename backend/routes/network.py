from flask import Blueprint, request, jsonify
from backend.services.firewall_service import FirewallService
from backend.services.network_detector import NetworkDetector
from backend.services.auth_service import role_required
from backend.extensions import db

network_bp = Blueprint('network', __name__, url_prefix='/api/network')

@network_bp.route('', methods=['GET'])
def get_network_status():
    """
    Returns active firewall block rules, execution mode, and interface information.
    """
    blocked_ips = FirewallService.list_blocked_ips()
    nft_available = FirewallService.is_nftables_available()

    return jsonify({
        "nftables_active": nft_available,
        "mode": "NFTABLES" if nft_available else "SIMULATION",
        "blocked_sources": blocked_ips,
        "active_block_count": len(blocked_ips)
    }), 200


@network_bp.route('/detect', methods=['GET'])
def detect_network():
    """
    Performs live network environment detection, primary IP resolution, and local port exposure scan.
    """
    result = NetworkDetector.detect(db_session=db.session)
    return jsonify(result), 200


@network_bp.route('/block', methods=['POST'])
@role_required(['admin', 'analyst'])
def block_ip():
    data = request.get_json() or {}
    ip_address = data.get('ip_address')
    reason = data.get('reason', 'Manual IP block via SOC Dashboard')

    if not ip_address:
        return jsonify({"error": "Bad Request", "message": "ip_address is required"}), 400

    result = FirewallService.block_ip(ip_address, reason=reason)
    return jsonify({
        "message": f"IP {ip_address} successfully blocked",
        "result": result
    }), 200


@network_bp.route('/block/<ip_address>', methods=['DELETE'])
@role_required(['admin'])
def unblock_ip(ip_address):
    success = FirewallService.unblock_ip(ip_address)
    if not success:
        return jsonify({"error": "Not Found", "message": f"IP {ip_address} not found in active blocks"}), 404

    return jsonify({"message": f"IP {ip_address} successfully unblocked"}), 200

