export type UserRole = 'admin' | 'analyst' | 'user';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

export interface SecurityEvent {
  id: number;
  timestamp: string;
  source_ip: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  action: string;
  raw_data?: string;
  status: string;
}

export interface BlockedSource {
  id: number;
  ip_address: string;
  reason: string;
  blocked_at: string;
  expires_at?: string;
  is_active: boolean;
  block_type: 'NFTABLES' | 'SIMULATION';
}

export interface ProtectedService {
  id: number;
  name: string;
  service_key: string;
  port: number;
  status: 'ONLINE' | 'ACTIVE' | 'WARNING' | 'OFFLINE';
  current_endpoint: string;
  default_endpoint: string;
  visibility: 'HIDDEN' | 'PROTECTED' | 'PUBLIC';
  last_event_at?: string;
}

export interface EndpointRotation {
  id: number;
  service_name: string;
  previous_endpoint: string;
  new_endpoint: string;
  reason: string;
  timestamp: string;
  triggered_event_id?: number;
  mode: 'NFTABLES' | 'SIMULATION' | 'NETWORK';
}

export interface PolicyRule {
  id: number;
  name: string;
  condition_type: string;
  threshold_score: number;
  action: string;
  is_active: boolean;
  description?: string;
}

export interface PolicyAction {
  id: number;
  timestamp: string;
  source_ip: string;
  threat_score: number;
  action_taken: string;
  trigger_reason: string;
  status: string;
}

export interface MetricItem {
  count: number;
  trend: string;
  description: string;
}

export interface DashboardSummary {
  metrics: {
    active_threats: MetricItem;
    blocked_sources: MetricItem;
    total_events: MetricItem;
    protected_services: MetricItem;
  };
  event_categories: {
    reconnaissance: number;
    port_scans: number;
    auth_failures: number;
    suspicious_traffic: number;
  };
  adaptive_network_state: {
    status: string;
    latest_adaptation: EndpointRotation;
  };
  recent_events: SecurityEvent[];
  protected_services: ProtectedService[];
}

export type TaskStatus = 'IMPLEMENTED' | 'PARTIAL' | 'SIMULATED' | 'NOT_IMPLEMENTED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type ModuleStatus = 'NOT STARTED' | 'IN PROGRESS' | 'TESTING' | 'COMPLETED' | 'SIMULATED';

export interface ProjectTask {
  id: number;
  module_id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  remarks?: string;
  order_index: number;
}

export interface ProjectModule {
  id: number;
  key: string;
  name: string;
  description?: string;
  order_index: number;
  progress: number;
  status: ModuleStatus;
  task_count: number;
  completed_tasks: number;
  partial_tasks: number;
  simulated_tasks: number;
  remaining_tasks: number;
  tasks?: ProjectTask[];
}

export interface TrackerSummary {
  overall_progress: number;
  modules: {
    total: number;
    completed: number;
    testing: number;
    in_progress: number;
    simulated: number;
    not_started: number;
    status_breakdown: Record<string, number>;
  };
  tasks: {
    total: number;
    completed: number;
    partial: number;
    simulated: number;
    remaining: number;
  };
  module_progress: ProjectModule[];
}
