from backend.models import ProjectModule, ProjectTask
from backend.extensions import db
from backend.services.tracker_service import TrackerService

def test_tracker_seeded(client):
    modules = ProjectModule.query.all()
    assert len(modules) >= 18
    assert ProjectTask.query.count() > 0

def test_tracker_summary_endpoint(client):
    res = client.get('/api/tracker/summary')
    assert res.status_code == 200
    data = res.get_json()
    assert 'overall_progress' in data
    assert data['modules']['total'] >= 18
    assert data['tasks']['total'] > 0
    assert data['tasks']['completed'] >= 0
    assert data['tasks']['remaining'] == data['tasks']['total'] - data['tasks']['completed']

def test_module_progress_automatic(client):
    module = ProjectModule.query.order_by(ProjectModule.order_index).first()
    progress = TrackerService.module_progress(module)
    assert 0.0 <= progress <= 100.0
    # 100% only when every task is IMPLEMENTED
    if progress == 100.0:
        assert all(t.status == 'IMPLEMENTED' for t in module.tasks)

def test_complete_task_updates_module(client, admin_token):
    module = ProjectModule.query.filter_by(key='documentation').first()
    task = ProjectTask.query.filter_by(module_id=module.id).first()
    before = TrackerService.module_progress(module)

    res = client.patch(
        f'/api/tracker/tasks/{task.id}',
        json={'status': 'IMPLEMENTED'},
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert res.status_code == 200
    data = res.get_json()
    assert data['task']['status'] == 'IMPLEMENTED'
    after = data['module']['progress']
    assert after > before

def test_task_update_requires_role(client, user_token):
    task = ProjectTask.query.first()
    res = client.patch(
        f'/api/tracker/tasks/{task.id}',
        json={'status': 'IMPLEMENTED'},
        headers={'Authorization': f'Bearer {user_token}'}
    )
    assert res.status_code == 403

def test_task_invalid_status_rejected(client, admin_token):
    task = ProjectTask.query.first()
    res = client.patch(
        f'/api/tracker/tasks/{task.id}',
        json={'status': 'BOGUS'},
        headers={'Authorization': f'Bearer {admin_token}'}
    )
    assert res.status_code == 400

def test_module_detail_contains_tasks(client):
    module = ProjectModule.query.first()
    res = client.get(f'/api/tracker/modules/{module.id}')
    assert res.status_code == 200
    data = res.get_json()
    assert 'tasks' in data
    assert len(data['tasks']) == len(module.tasks)
