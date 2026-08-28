from flask import Blueprint, request, jsonify
from backend.models import PolicyRule, PolicyAction
from backend.extensions import db
from backend.services.auth_service import role_required

policies_bp = Blueprint('policies', __name__, url_prefix='/api')

@policies_bp.route('/policies', methods=['GET'])
def get_policies():
    rules = PolicyRule.query.all()
    actions = PolicyAction.query.order_by(PolicyAction.timestamp.desc()).limit(30).all()
    return jsonify({
        "rules": [r.to_dict() for r in rules],
        "recent_actions": [a.to_dict() for a in actions]
    }), 200


@policies_bp.route('/policies', methods=['POST'])
@role_required(['admin'])
def create_policy():
    data = request.get_json() or {}
    name = data.get('name')
    condition_type = data.get('condition_type')
    threshold_score = data.get('threshold_score', 50)
    action = data.get('action')
    description = data.get('description', '')

    if not name or not condition_type or not action:
        return jsonify({"error": "Bad Request", "message": "name, condition_type, and action are required"}), 400

    rule = PolicyRule(
        name=name,
        condition_type=condition_type,
        threshold_score=threshold_score,
        action=action,
        description=description,
        is_active=True
    )
    db.session.add(rule)
    db.session.commit()

    return jsonify({"message": "Policy rule created successfully", "rule": rule.to_dict()}), 201


@policies_bp.route('/policies/<int:rule_id>', methods=['PUT'])
@role_required(['admin'])
def update_policy(rule_id):
    rule = PolicyRule.query.get_or_404(rule_id)
    data = request.get_json() or {}

    if 'threshold_score' in data:
        rule.threshold_score = data['threshold_score']
    if 'action' in data:
        rule.action = data['action']
    if 'is_active' in data:
        rule.is_active = data['is_active']
    if 'description' in data:
        rule.description = data['description']

    db.session.commit()
    return jsonify({"message": "Policy rule updated", "rule": rule.to_dict()}), 200
