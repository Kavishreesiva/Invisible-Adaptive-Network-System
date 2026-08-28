import type { DashboardSummary, SecurityEvent, BlockedSource, ProtectedService, EndpointRotation, PolicyRule, PolicyAction, User, TrackerSummary, ProjectModule, ProjectTask, TaskStatus } from '../types/security';

const API_BASE = 'http://localhost:5000/api';

export const getAuthToken = (): string | null => {
  return localStorage.getItem('iansa_token');
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('iansa_token', token);
  } else {
    localStorage.removeItem('iansa_token');
  }
};

const authHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const api = {
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    setAuthToken(data.access_token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: authHeaders()
      });
    } finally {
      setAuthToken(null);
    }
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Session expired');
    const data = await res.json();
    return data.user;
  },

  async getDashboardSummary(): Promise<DashboardSummary> {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch dashboard summary');
    return res.json();
  },

  async getStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/status`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch status');
    return res.json();
  },

  async getEvents(severity?: string, limit = 50): Promise<SecurityEvent[]> {
    const url = new URL(`${API_BASE}/events`);
    if (severity) url.searchParams.append('severity', severity);
    url.searchParams.append('limit', limit.toString());

    const res = await fetch(url.toString(), { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  async getThreats(timeframe = '24H'): Promise<any> {
    const res = await fetch(`${API_BASE}/threats?timeframe=${timeframe}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch threat analytics');
    return res.json();
  },

  async getNetworkStatus(): Promise<{ mode: string; blocked_sources: BlockedSource[] }> {
    const res = await fetch(`${API_BASE}/network`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch network status');
    return res.json();
  },

  async getNetworkDetection(): Promise<any> {
    const res = await fetch(`${API_BASE}/network/detect`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to perform live network detection');
    return res.json();
  },

  async blockIp(ip_address: string, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/network/block`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ip_address, reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Block failed');
    }
    return res.json();
  },

  async unblockIp(ip_address: string): Promise<any> {
    const res = await fetch(`${API_BASE}/network/block/${encodeURIComponent(ip_address)}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Unblock failed');
    return res.json();
  },

  async getServices(): Promise<{ services: ProtectedService[]; recent_rotations: EndpointRotation[] }> {
    const res = await fetch(`${API_BASE}/services`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch protected services');
    return res.json();
  },

  async rotateService(service_id: number, reason: string): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${service_id}/rotate`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Rotation failed');
    }
    return res.json();
  },

  async getPolicies(): Promise<{ rules: PolicyRule[]; recent_actions: PolicyAction[] }> {
    const res = await fetch(`${API_BASE}/policies`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch policies');
    return res.json();
  },

  async triggerAttackSimulation(attack_type: string, source_ip: string): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/trigger-attack`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ attack_type, source_ip })
    });
    if (!res.ok) throw new Error('Simulation failed');
    return res.json();
  },

  async testProtectedEndpoint(): Promise<any> {
    const res = await fetch(`${API_BASE}/protected`, {
      headers: authHeaders()
    });
    const data = await res.json();
    return { status: res.status, data };
  },

  async testAdminEndpoint(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin`, {
      headers: authHeaders()
    });
    const data = await res.json();
    return { status: res.status, data };
  },

  async getTrackerSummary(): Promise<TrackerSummary> {
    const res = await fetch(`${API_BASE}/tracker/summary`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch project tracker summary');
    return res.json();
  },

  async getTrackerModules(): Promise<ProjectModule[]> {
    const res = await fetch(`${API_BASE}/tracker/modules`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch tracker modules');
    return res.json();
  },

  async getTrackerModule(id: number): Promise<ProjectModule> {
    const res = await fetch(`${API_BASE}/tracker/modules/${id}`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch module detail');
    return res.json();
  },

  async updateTask(taskId: number, data: { status?: TaskStatus; priority?: string; remarks?: string }): Promise<{ task: ProjectTask; module: ProjectModule }> {
    const res = await fetch(`${API_BASE}/tracker/tasks/${taskId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Task update failed');
    }
    return res.json();
  },

  async queryChatbot(prompt: string): Promise<{ reply: string; intent: string; quick_prompts?: string[] }> {
    const res = await fetch(`${API_BASE}/chatbot/query`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) throw new Error('Chatbot query failed');
    return res.json();
  }
};
