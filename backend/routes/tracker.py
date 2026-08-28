from flask import Blueprint, request, jsonify
from backend.models import ProjectModule, ProjectTask
from backend.extensions import db
from backend.services.tracker_service import TrackerService, TASK_STATUS
from backend.services.auth_service import role_required

tracker_bp = Blueprint('tracker', __name__, url_prefix='/api/tracker')

@tracker_bp.route('/summary', methods=['GET'])
def get_summary():
    return jsonify(TrackerService.get_summary()), 200

@tracker_bp.route('/modules', methods=['GET'])
def get_modules():
    modules = ProjectModule.query.order_by(ProjectModule.order_index).all()
    return jsonify([TrackerService.serialize_module(m) for m in modules]), 200

@tracker_bp.route('/modules/<int:module_id>', methods=['GET'])
def get_module_detail(module_id):
    module = ProjectModule.query.get_or_404(module_id)
    return jsonify(TrackerService.serialize_module(module, with_tasks=True)), 200

@tracker_bp.route('/tasks/<int:task_id>', methods=['PATCH'])
@role_required(['admin', 'analyst'])
def update_task(task_id):
    task = ProjectTask.query.get_or_404(task_id)
    data = request.get_json() or {}

    if 'status' in data:
        status = str(data['status']).upper()
        if status not in TASK_STATUS:
            return jsonify({"error": "Bad Request", "message": f"status must be one of {TASK_STATUS}"}), 400
        task.status = status

    if 'priority' in data:
        priority = str(data['priority']).upper()
        if priority not in ['LOW', 'MEDIUM', 'HIGH']:
            return jsonify({"error": "Bad Request", "message": "priority must be LOW, MEDIUM or HIGH"}), 400
        task.priority = priority

    if 'remarks' in data:
        task.remarks = data.get('remarks')

    db.session.commit()

    module = ProjectModule.query.get(task.module_id)
    return jsonify({
        "message": "Task updated successfully",
        "task": task.to_dict(),
        "module": TrackerService.serialize_module(module, with_tasks=True),
    }), 200
