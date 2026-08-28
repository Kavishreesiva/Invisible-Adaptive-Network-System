from backend.models import ProjectModule, ProjectTask
from backend.extensions import db

TASK_STATUS = ['IMPLEMENTED', 'PARTIAL', 'SIMULATED', 'NOT_IMPLEMENTED']

# Contribution weight of each task status towards module progress.
# IMPLEMENTED = full credit, PARTIAL = half, SIMULATED = UI/mock only, NOT_IMPLEMENTED = 0.
STATUS_WEIGHT = {
    'IMPLEMENTED': 1.0,
    'PARTIAL': 0.5,
    'SIMULATED': 0.25,
    'NOT_IMPLEMENTED': 0.0,
}

MODULE_STATUS_DISPLAY = {
    'NOT_STARTED': 'NOT STARTED',
    'IN_PROGRESS': 'IN PROGRESS',
    'TESTING': 'TESTING',
    'COMPLETED': 'COMPLETED',
    'SIMULATED': 'SIMULATED',
}

class TrackerService:
    """Project implementation tracker: computes module & project progress
    automatically from the detailed task statuses. Percentages are never
    hardcoded — they are always derived from the task rows."""

    @staticmethod
    def task_contribution(task: ProjectTask) -> float:
        return STATUS_WEIGHT.get(task.status, 0.0)

    @classmethod
    def module_progress(cls, module: ProjectModule) -> float:
        """Progress (0-100) derived from the module's tasks."""
        tasks = module.tasks
        if not tasks:
            return 0.0
        total = len(tasks)
        earned = sum(cls.task_contribution(t) for t in tasks)
        return round((earned / total) * 100, 1)

    @classmethod
    def module_status(cls, module: ProjectModule, progress: float = None) -> str:
        """Derives module status from progress and task states."""
        if progress is None:
            progress = cls.module_progress(module)

        if progress <= 0:
            return MODULE_STATUS_DISPLAY['NOT_STARTED']
        if progress >= 100:
            return MODULE_STATUS_DISPLAY['COMPLETED']

        tasks = module.tasks
        # If every contributing task is only simulated -> SIMULATED module.
        if tasks:
            contributing = [t for t in tasks if cls.task_contribution(t) > 0]
            if contributing and all(t.status == 'SIMULATED' for t in contributing):
                return MODULE_STATUS_DISPLAY['SIMULATED']
            # Any partially-implemented core tasks keeps it in progress.
            partials = [t for t in tasks if t.status in ('PARTIAL', 'SIMULATED')]
            if partials and progress < 90:
                return MODULE_STATUS_DISPLAY['IN_PROGRESS']

        if progress >= 80:
            return MODULE_STATUS_DISPLAY['TESTING']
        return MODULE_STATUS_DISPLAY['IN_PROGRESS']

    @classmethod
    def serialize_module(cls, module: ProjectModule, with_tasks: bool = False) -> dict:
        progress = cls.module_progress(module)
        status = cls.module_status(module, progress)
        tasks = module.tasks
        data = {
            **module.to_dict(),
            'progress': progress,
            'status': status,
            'task_count': len(tasks),
            'completed_tasks': sum(1 for t in tasks if t.status == 'IMPLEMENTED'),
            'partial_tasks': sum(1 for t in tasks if t.status == 'PARTIAL'),
            'simulated_tasks': sum(1 for t in tasks if t.status == 'SIMULATED'),
            'remaining_tasks': sum(1 for t in tasks if t.status != 'IMPLEMENTED'),
        }
        if with_tasks:
            data['tasks'] = [t.to_dict() for t in tasks]
        return data

    @classmethod
    def get_summary(cls) -> dict:
        modules = ProjectModule.query.order_by(ProjectModule.order_index).all()
        all_tasks = ProjectTask.query.all()

        total_tasks = len(all_tasks)
        completed_tasks = sum(1 for t in all_tasks if t.status == 'IMPLEMENTED')
        remaining_tasks = total_tasks - completed_tasks

        module_list = [cls.serialize_module(m) for m in modules]
        overall = 0.0
        if modules:
            overall = round(sum(m['progress'] for m in module_list) / len(modules), 1)

        status_counts = {}
        for m in module_list:
            status_counts[m['status']] = status_counts.get(m['status'], 0) + 1

        return {
            'overall_progress': overall,
            'modules': {
                'total': len(modules),
                'completed': status_counts.get('COMPLETED', 0),
                'testing': status_counts.get('TESTING', 0),
                'in_progress': status_counts.get('IN_PROGRESS', 0),
                'simulated': status_counts.get('SIMULATED', 0),
                'not_started': status_counts.get('NOT STARTED', 0),
                'status_breakdown': status_counts,
            },
            'tasks': {
                'total': total_tasks,
                'completed': completed_tasks,
                'partial': sum(1 for t in all_tasks if t.status == 'PARTIAL'),
                'simulated': sum(1 for t in all_tasks if t.status == 'SIMULATED'),
                'remaining': remaining_tasks,
            },
            'module_progress': module_list,
        }

    @classmethod
    def ensure_seeded(cls):
        """Creates tracker modules & tasks if the tracker is empty.
        Initial task statuses reflect the ACTUAL state of the codebase."""
        if ProjectModule.query.count() > 0:
            return False

        definitions = [
            {
                'key': 'requirement_analysis',
                'name': 'Requirement Analysis',
                'description': 'Threat model, attack vector catalogue and system requirements definition.',
                'tasks': [
                    ('Security requirements & threat model documentation', 'Documented defensive goals: port knocking, moving target defense, recon prevention.', 'PARTIAL', 'MEDIUM', 'Minimal README exists; full requirements doc pending.'),
                    ('Attack vector identification', 'Port scans, reconnaissance, brute-force auth, exploit payloads identified and simulated.', 'IMPLEMENTED', 'HIGH', 'AttackSimulatorModal covers 4 attack vectors.'),
                    ('System architecture design', 'Central gateway + protected stealth mesh architecture.', 'IMPLEMENTED', 'HIGH', 'NetworkTopology + Config execution modes.'),
                    ('Implementation plan & module breakdown', 'Detailed task tracker for every project module.', 'IMPLEMENTED', 'HIGH', 'This tracker itself.'),
                ],
            },
            {
                'key': 'network_architecture',
                'name': 'Network Architecture',
                'description': 'Gateway, segmented zones and dynamic internal routing design.',
                'tasks': [
                    ('Central IANSA gateway design', 'Single control point in front of all protected services.', 'IMPLEMENTED', 'HIGH', 'Gateway blueprints in backend/routes.'),
                    ('Stealth network topology', 'External -> Gateway -> Hidden mesh layout.', 'IMPLEMENTED', 'HIGH', 'NetworkTopology component.'),
                    ('Protected zone segmentation', 'HIDDEN / PROTECTED / PUBLIC visibility levels.', 'IMPLEMENTED', 'MEDIUM', 'ProtectedService.visibility model.'),
                    ('Internal routing & endpoint mapping', 'Resolution of active stealth endpoints to services.', 'PARTIAL', 'MEDIUM', 'Endpoint rotation simulates aliasing; no real DNS/proxy mapping.'),
                    ('Production network deployment', 'Real multi-node network deployment.', 'NOT_IMPLEMENTED', 'LOW', 'Lab/simulation only.'),
                ],
            },
            {
                'key': 'authentication_gateway',
                'name': 'Authentication Gateway',
                'description': 'Login, password hashing, JWT sessions and authentication audit.',
                'tasks': [
                    ('Login interface', 'Username/password login form and API.', 'IMPLEMENTED', 'HIGH', 'LoginModal + POST /api/auth/login.'),
                    ('Password hashing', 'Secure password storage using werkzeug.', 'IMPLEMENTED', 'HIGH', 'User.set_password / check_password.'),
                    ('Authentication API', 'Login/logout/me endpoints.', 'IMPLEMENTED', 'HIGH', 'backend/routes/auth.py.'),
                    ('JWT token generation', 'Signed access tokens with role & username claims.', 'IMPLEMENTED', 'HIGH', 'flask_jwt_extended create_access_token.'),
                    ('Session management', 'Token lifecycle, revocation, expiry handling.', 'PARTIAL', 'MEDIUM', 'Stateless JWT with 8h expiry; no server-side revocation.'),
                    ('Logout', 'Client logout flow.', 'IMPLEMENTED', 'MEDIUM', 'POST /api/auth/logout + client token removal.'),
                    ('Authentication logging', 'Audit of every auth attempt.', 'IMPLEMENTED', 'MEDIUM', 'AuthenticationEvent table.'),
                    ('Failed-login detection', 'Security event on failed credentials.', 'IMPLEMENTED', 'MEDIUM', 'AUTH_FAILURE SecurityEvent on failure.'),
                    ('Multi-factor authentication', 'TOTP / OTP second factor.', 'NOT_IMPLEMENTED', 'LOW', 'Future enhancement.'),
                ],
            },
            {
                'key': 'rbac',
                'name': 'Role-Based Access Control',
                'description': 'Admin, Analyst and User roles enforced server-side.',
                'tasks': [
                    ('Admin role', 'Full administration access.', 'IMPLEMENTED', 'HIGH', 'Seed admin account + /api/admin route.'),
                    ('Analyst role', 'SOC analysis & blocking privileges.', 'IMPLEMENTED', 'HIGH', 'Seed analyst account; block_ip allowed.'),
                    ('User role', 'Standard user access.', 'IMPLEMENTED', 'HIGH', 'Seed user account.'),
                    ('Server-side authorization', 'Role enforcement via decorator.', 'IMPLEMENTED', 'HIGH', 'role_required in auth_service.'),
                    ('Protected routes', 'Authenticated resource endpoints.', 'IMPLEMENTED', 'HIGH', 'GET /api/protected.'),
                    ('Admin-only routes', 'Restricted administrative endpoints.', 'IMPLEMENTED', 'HIGH', 'GET /api/admin, policy/rotate/block mutations.'),
                    ('Unauthorized access handling', '401/403 with security event logging.', 'IMPLEMENTED', 'HIGH', 'role_required logs RBAC_AUTHORIZATION_FAILURE.'),
                    ('Authorization logging', 'Audit of denied access attempts.', 'IMPLEMENTED', 'MEDIUM', 'SecurityEvent RBAC_AUTHORIZATION_FAILURE.'),
                ],
            },
            {
                'key': 'stealth_network',
                'name': 'Stealth Network',
                'description': 'Service hiding, moving target defense and endpoint mutation.',
                'tasks': [
                    ('Service visibility control', 'HIDDEN / PROTECTED / PUBLIC states.', 'IMPLEMENTED', 'HIGH', 'ProtectedService.visibility.'),
                    ('Dynamic endpoint generation', 'Randomized stealth hostnames.', 'IMPLEMENTED', 'HIGH', 'EndpointAdaptationService.generate_dynamic_endpoint.'),
                    ('Endpoint rotation', 'Automatic & manual endpoint mutation.', 'IMPLEMENTED', 'HIGH', 'rotate_service_endpoint.'),
                    ('Unauthorized service access prevention', 'Prevent direct access to hidden services.', 'PARTIAL', 'HIGH', 'Simulated only; no real access proxy.'),
                    ('Port / service exposure control', 'Control which ports are externally visible.', 'PARTIAL', 'MEDIUM', 'Port metadata tracked; no live firewall hiding.'),
                    ('Stealth validation', 'Verify services are unreachable when hidden.', 'PARTIAL', 'MEDIUM', 'Reported state only.'),
                    ('Moving target defense (MTD)', 'Continuous endpoint mutation under threat.', 'PARTIAL', 'MEDIUM', 'Triggered on QUARANTINE; not continuous.'),
                ],
            },
            {
                'key': 'firewall',
                'name': 'Firewall / Network Enforcement',
                'description': 'IP blocking and blackhole enforcement via nftables or simulation.',
                'tasks': [
                    ('IP blocking', 'Block a source IP.', 'IMPLEMENTED', 'HIGH', 'FirewallService.block_ip.'),
                    ('IP unblocking', 'Remove a source from active blocks.', 'IMPLEMENTED', 'HIGH', 'FirewallService.unblock_ip.'),
                    ('Blocked source list', 'Query active enforcements.', 'IMPLEMENTED', 'HIGH', 'list_blocked_ips + /api/network.'),
                    ('Firewall status reporting', 'Report enforcement mode & availability.', 'IMPLEMENTED', 'MEDIUM', '/api/status components.firewall.'),
                    ('nftables integration', 'Native blackhole element management.', 'PARTIAL', 'MEDIUM', 'Implemented; only active in LINUX_NATIVE mode.'),
                    ('Native enforcement', 'Real firewall rules in this environment.', 'SIMULATED', 'LOW', 'Runs in SIMULATION execution mode.'),
                ],
            },
            {
                'key': 'reconnaissance_detection',
                'name': 'Reconnaissance Detection',
                'description': 'Detect port scans, probing and directory fuzzing.',
                'tasks': [
                    ('Port scan detection', 'SYN / nmap scan classification.', 'IMPLEMENTED', 'HIGH', 'ids_service classification + PORT_SCAN simulation.'),
                    ('Directory recon / fuzzing detection', 'Reconnaissance probe detection.', 'IMPLEMENTED', 'HIGH', 'RECONNAISSANCE events.'),
                    ('Service probing detection', 'Stealth service discovery attempts.', 'PARTIAL', 'MEDIUM', 'Covered by recon classification.'),
                    ('Suricata eve.json parsing', 'Normalize Suricata alert logs.', 'IMPLEMENTED', 'HIGH', 'IDSService.parse_suricata_alert.'),
                    ('Live Suricata integration', 'Tail real-time eve.json feed.', 'PARTIAL', 'MEDIUM', 'Parser wired; no background log watcher.'),
                ],
            },
            {
                'key': 'threat_detection',
                'name': 'Threat Detection',
                'description': 'Security event generation, normalization and classification.',
                'tasks': [
                    ('Security event generation', 'Create normalized events from all inputs.', 'IMPLEMENTED', 'HIGH', 'SecurityEvent model + ingest.'),
                    ('Event normalization', 'Standard fields for every event.', 'IMPLEMENTED', 'HIGH', 'SecurityEvent.to_dict schema.'),
                    ('Severity classification', 'LOW/MEDIUM/HIGH/CRITICAL assignment.', 'IMPLEMENTED', 'HIGH', 'Deterministic severity mapping.'),
                    ('Confidence scoring', 'Per-event confidence metric.', 'IMPLEMENTED', 'MEDIUM', 'confidence field 0-1.'),
                    ('Event query & filter API', 'Filter events by severity/type/limit.', 'IMPLEMENTED', 'MEDIUM', 'GET /api/events.'),
                ],
            },
            {
                'key': 'threat_scoring',
                'name': 'Threat Scoring',
                'description': 'Deterministic 0-100 threat score per source IP.',
                'tasks': [
                    ('Deterministic scoring model', 'Rule-based 0-100 score.', 'IMPLEMENTED', 'HIGH', 'PolicyEngine.calculate_threat_score.'),
                    ('Multi-factor scoring', 'Traffic, port scan, auth failure, malicious, recon factors.', 'IMPLEMENTED', 'HIGH', 'Five weighted factors.'),
                    ('Score to severity mapping', 'Map score to severity band.', 'IMPLEMENTED', 'HIGH', 'score_to_severity.'),
                    ('Per-IP threat aggregation', 'Group threats by source IP.', 'IMPLEMENTED', 'MEDIUM', 'GET /api/threats.'),
                    ('Score audit trail', 'Record why each score was assigned.', 'IMPLEMENTED', 'MEDIUM', 'PolicyAction.trigger_reason.'),
                ],
            },
            {
                'key': 'adaptive_policy_engine',
                'name': 'Adaptive Policy Engine',
                'description': 'Threshold-based decisions with automatic defensive actions.',
                'tasks': [
                    ('Policy rules model', 'Stored configurable rules.', 'IMPLEMENTED', 'HIGH', 'PolicyRule table.'),
                    ('Threat classification', 'Classify score bands.', 'IMPLEMENTED', 'HIGH', 'score_to_severity.'),
                    ('Risk score evaluation', 'Evaluate IP against rules.', 'IMPLEMENTED', 'HIGH', 'evaluate_and_respond.'),
                    ('Policy decision', 'ALLOW/MONITOR/RATE_LIMIT/BLOCK/QUARANTINE decision.', 'IMPLEMENTED', 'HIGH', 'Threshold + rule matching.'),
                    ('BLOCK action', 'Block IP at firewall.', 'IMPLEMENTED', 'HIGH', 'FirewallService.block_ip.'),
                    ('QUARANTINE action', 'Block + endpoint rotation.', 'IMPLEMENTED', 'HIGH', 'evaluate_and_respond critical path.'),
                    ('RATE_LIMIT enforcement', 'Apply strict request rate limiting.', 'PARTIAL', 'MEDIUM', 'Decision exists; no live throttling enforced.'),
                    ('Endpoint adaptation trigger', 'Rotate endpoints on threat.', 'IMPLEMENTED', 'HIGH', 'EndpointAdaptationService call.'),
                    ('Policy logging', 'Record every policy execution.', 'IMPLEMENTED', 'MEDIUM', 'PolicyAction table.'),
                ],
            },
            {
                'key': 'automated_response',
                'name': 'Automated Response',
                'description': 'Automatic defensive actions without manual intervention.',
                'tasks': [
                    ('Auto block on high threat', 'Block when score >= 50.', 'IMPLEMENTED', 'HIGH', 'evaluate_and_respond.'),
                    ('Auto quarantine on critical', 'Isolate when score >= 75.', 'IMPLEMENTED', 'HIGH', 'QUARANTINE path.'),
                    ('Auto endpoint rotation', 'Rotate endpoints on critical.', 'IMPLEMENTED', 'HIGH', 'rotation_result on QUARANTINE.'),
                    ('Manual SOC override', 'Operator can unblock / rotate.', 'IMPLEMENTED', 'MEDIUM', 'Unblock + rotate endpoints in UI.'),
                    ('Response audit trail', 'Every automated response recorded.', 'IMPLEMENTED', 'MEDIUM', 'PolicyAction + EndpointRotation.'),
                ],
            },
            {
                'key': 'endpoint_adaptation',
                'name': 'Dynamic Endpoint / IP Adaptation',
                'description': 'Moving target defense mechanics.',
                'tasks': [
                    ('Dynamic endpoint generation', 'Randomized service hostnames.', 'IMPLEMENTED', 'HIGH', 'uuid-based generation.'),
                    ('Rotation history', 'Audit of every rotation.', 'IMPLEMENTED', 'HIGH', 'EndpointRotation table.'),
                    ('Service endpoint update', 'Update current active endpoint.', 'IMPLEMENTED', 'HIGH', 'rotate_service_endpoint.'),
                    ('Policy-triggered rotation', 'Auto rotation from policy engine.', 'IMPLEMENTED', 'HIGH', 'Triggered on QUARANTINE.'),
                    ('Manual rotation', 'Operator triggered rotation.', 'IMPLEMENTED', 'MEDIUM', 'POST /api/services/<id>/rotate.'),
                    ('Network-level mapping', 'Real iptables/nftables alias changes.', 'SIMULATED', 'LOW', 'Only executes in LINUX_NATIVE mode.'),
                ],
            },
            {
                'key': 'protected_services',
                'name': 'Protected Services',
                'description': 'Registry of hidden services behind the gateway.',
                'tasks': [
                    ('Service registry', 'Register & list protected services.', 'IMPLEMENTED', 'HIGH', 'ProtectedService table + API.'),
                    ('Visibility levels', 'HIDDEN / PROTECTED / PUBLIC.', 'IMPLEMENTED', 'HIGH', 'visibility field.'),
                    ('Service status tracking', 'ONLINE / ACTIVE / WARNING / OFFLINE.', 'IMPLEMENTED', 'MEDIUM', 'status field.'),
                    ('Service rotation API', 'Rotate a service endpoint.', 'IMPLEMENTED', 'HIGH', 'POST /api/services/<id>/rotate.'),
                    ('Service exposure control', 'Control external exposure per service.', 'PARTIAL', 'MEDIUM', 'Visibility model only.'),
                ],
            },
            {
                'key': 'event_logging',
                'name': 'Security Event Logging',
                'description': 'Audit trail of all security-relevant activity.',
                'tasks': [
                    ('Security events log', 'Normalized IDS/gateway events.', 'IMPLEMENTED', 'HIGH', 'security_events table.'),
                    ('Authentication events log', 'All login attempts.', 'IMPLEMENTED', 'HIGH', 'authentication_events table.'),
                    ('Policy action log', 'Policy engine executions.', 'IMPLEMENTED', 'HIGH', 'policy_actions table.'),
                    ('Endpoint rotation log', 'Endpoint mutation history.', 'IMPLEMENTED', 'MEDIUM', 'endpoint_rotations table.'),
                    ('Blocked source log', 'Active & expired blocks.', 'IMPLEMENTED', 'MEDIUM', 'blocked_sources table.'),
                    ('Audit query API', 'Retrieve audit records.', 'IMPLEMENTED', 'MEDIUM', '/api/policies, /api/events.'),
                    ('Immutable audit trail', 'Tamper-evident log storage.', 'NOT_IMPLEMENTED', 'LOW', 'No hash-chaining.'),
                ],
            },
            {
                'key': 'dashboard',
                'name': 'Monitoring Dashboard',
                'description': 'Real-time SOC overview with project progress.',
                'tasks': [
                    ('Security overview KPIs', 'Active threats, blocks, events, services.', 'IMPLEMENTED', 'HIGH', 'MetricCard grid.'),
                    ('Threat count', 'Live threat totals & trend.', 'IMPLEMENTED', 'HIGH', 'Dashboard summary metrics.'),
                    ('Blocked sources panel', 'Active IP enforcements.', 'IMPLEMENTED', 'HIGH', 'Network tab table.'),
                    ('Security events stream', 'Live event table with filters.', 'IMPLEMENTED', 'HIGH', 'SecurityEventTable.'),
                    ('Network status', 'Subsystem health panel.', 'IMPLEMENTED', 'MEDIUM', 'NetworkStatus component.'),
                    ('Adaptive network status', 'MTD state & latest rotation.', 'IMPLEMENTED', 'HIGH', 'AdaptiveNetwork component.'),
                    ('Protected services view', 'Stealth service grid.', 'IMPLEMENTED', 'HIGH', 'ProtectedServices component.'),
                    ('Threat charts', 'Trend visualization.', 'IMPLEMENTED', 'MEDIUM', 'ThreatChart (recharts).'),
                    ('Event table', 'Detailed event listing.', 'IMPLEMENTED', 'MEDIUM', 'SecurityEventTable.'),
                    ('Network topology', 'Architecture diagram.', 'IMPLEMENTED', 'MEDIUM', 'NetworkTopology component.'),
                    ('Real-time updates', 'Live polling of SOC data.', 'IMPLEMENTED', 'MEDIUM', '5s polling in App.'),
                    ('Project progress dashboard', 'Tracker overview on dashboard.', 'IMPLEMENTED', 'HIGH', 'ProjectProgress section.'),
                ],
            },
            {
                'key': 'network_topology',
                'name': 'Network Topology',
                'description': 'Visualization of gateway and stealth zone.',
                'tasks': [
                    ('Topology visualization', 'Graphical network layout.', 'IMPLEMENTED', 'HIGH', 'NetworkTopology component.'),
                    ('Gateway control point', 'Central node representation.', 'IMPLEMENTED', 'MEDIUM', 'IANSA CENTRAL GATEWAY box.'),
                    ('Stealth zone rendering', 'Protected services mesh display.', 'IMPLEMENTED', 'MEDIUM', 'Hidden mesh section.'),
                    ('Live node status', 'Dynamic status per node.', 'PARTIAL', 'MEDIUM', 'Static labels; not data-driven.'),
                    ('Interactive elements', 'Clickable / animated nodes.', 'NOT_IMPLEMENTED', 'LOW', 'Static diagram only.'),
                ],
            },
            {
                'key': 'testing',
                'name': 'Testing & Validation',
                'description': 'Automated and manual verification of the system.',
                'tasks': [
                    ('Unit tests', 'Backend unit test suite.', 'IMPLEMENTED', 'HIGH', 'tests/ directory.'),
                    ('API tests', 'Endpoint integration tests.', 'PARTIAL', 'MEDIUM', 'Auth & RBAC covered; not all endpoints.'),
                    ('RBAC tests', 'Role enforcement verification.', 'IMPLEMENTED', 'HIGH', 'test_rbac.py.'),
                    ('Policy engine tests', 'Scoring & response tests.', 'IMPLEMENTED', 'HIGH', 'test_policy_engine.py.'),
                    ('Endpoint adaptation tests', 'Rotation behavior tests.', 'IMPLEMENTED', 'MEDIUM', 'test_endpoint_adaptation.py.'),
                    ('Attack simulation', 'Live attack pipeline simulation.', 'IMPLEMENTED', 'HIGH', 'AttackSimulatorModal + API.'),
                    ('Tracker progress tests', 'Auto progress calculation tests.', 'IMPLEMENTED', 'MEDIUM', 'test_tracker.py.'),
                    ('CI pipeline', 'Automated CI test runner.', 'NOT_IMPLEMENTED', 'LOW', 'No CI config yet.'),
                ],
            },
            {
                'key': 'documentation',
                'name': 'Documentation',
                'description': 'Project, API and deployment documentation.',
                'tasks': [
                    ('README', 'Project overview.', 'PARTIAL', 'MEDIUM', 'Two-line README; expand.'),
                    ('Architecture documentation', 'System design & module documentation.', 'PARTIAL', 'MEDIUM', 'Topology visual only.'),
                    ('API documentation', 'Endpoint reference.', 'NOT_IMPLEMENTED', 'MEDIUM', 'Missing.'),
                    ('User guide', 'Operator / SOC usage guide.', 'NOT_IMPLEMENTED', 'LOW', 'Missing.'),
                    ('Deployment guide', 'Environment setup & execution modes.', 'NOT_IMPLEMENTED', 'LOW', 'Missing.'),
                ],
            },
        ]

        for idx, mod in enumerate(definitions):
            module = ProjectModule(
                key=mod['key'],
                name=mod['name'],
                description=mod['description'],
                order_index=idx,
            )
            db.session.add(module)
            db.session.flush()
            for tidx, (title, description, status, priority, remarks) in enumerate(mod['tasks']):
                db.session.add(ProjectTask(
                    module_id=module.id,
                    title=title,
                    description=description,
                    status=status,
                    priority=priority,
                    remarks=remarks,
                    order_index=tidx,
                ))

        db.session.commit()
        return True
