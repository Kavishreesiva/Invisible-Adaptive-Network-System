import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MetricCard } from './components/MetricCard';
import { ThreatChart } from './components/ThreatChart';
import { NetworkStatus } from './components/NetworkStatus';
import { SecurityEventTable } from './components/SecurityEventTable';
import { AdaptiveNetwork } from './components/AdaptiveNetwork';
import { ProtectedServices } from './components/ProtectedServices';
import { NetworkTopology } from './components/NetworkTopology';
import { PolicyActions } from './components/PolicyActions';
import { AttackSimulatorModal } from './components/AttackSimulatorModal';
import { LoginModal } from './components/LoginModal';
import { ProjectProgress } from './components/ProjectProgress';
import { ProjectTracker } from './components/ProjectTracker';
import { ModuleDetail } from './components/ModuleDetail';
import { ToastNotification, type ToastMessage } from './components/ToastNotification';
import { NetworkDetectorCard, type NetworkDetectionData } from './components/NetworkDetectorCard';
import { SOCChatbot } from './components/SOCChatbot';
import { api } from './services/api';
import type { DashboardSummary, User, BlockedSource, PolicyRule, PolicyAction, TrackerSummary, ProjectModule } from './types/security';
import { ShieldAlert, ShieldCheck, ListFilter, Server, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [blockedSources, setBlockedSources] = useState<BlockedSource[]>([]);
  const [policies, setPolicies] = useState<{ rules: PolicyRule[]; recent_actions: PolicyAction[] }>({ rules: [], recent_actions: [] });
  const [trackerSummary, setTrackerSummary] = useState<TrackerSummary | null>(null);
  const [selectedModule, setSelectedModule] = useState<ProjectModule | null>(null);
  const [networkDetection, setNetworkDetection] = useState<NetworkDetectionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // RBAC test states
  const [rbacTestResult, setRbacTestResult] = useState<any>(null);

  const addToast = (type: 'info' | 'success' | 'alert', title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchAllData = async () => {
    try {
      const sumData = await api.getDashboardSummary();
      setSummary(sumData);

      const netData = await api.getNetworkStatus();
      setBlockedSources(netData.blocked_sources || []);

      const polData = await api.getPolicies();
      setPolicies(polData);

      const trackerData = await api.getTrackerSummary();
      setTrackerSummary(trackerData);

      const detectData = await api.getNetworkDetection();
      setNetworkDetection(detectData);

      if (detectData && detectData.ip_changed) {
        addToast(
          'alert',
          'Network Environment Changed',
          `Switched IP: ${detectData.previous_ip} → ${detectData.current_ip} (${detectData.network_name})`
        );
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModule = async (moduleId: number) => {
    setActiveTab('tracker');
    if (!moduleId) {
      setSelectedModule(null);
      return;
    }
    try {
      const mod = await api.getTrackerModule(moduleId);
      setSelectedModule(mod);
    } catch (err) {
      console.error('Failed to load module detail:', err);
    }
  };

  const refreshModule = async () => {
    try {
      const trackerData = await api.getTrackerSummary();
      setTrackerSummary(trackerData);
      if (selectedModule) {
        const mod = await api.getTrackerModule(selectedModule.id);
        setSelectedModule(mod);
      }
    } catch (err) {
      console.error('Failed to refresh tracker:', err);
    }
  };

  useEffect(() => {
    // Check logged in user
    api.getMe()
      .then(setUser)
      .catch(() => setUser({ id: 1, username: 'admin', role: 'admin', created_at: new Date().toISOString() }));

    fetchAllData();

    // Polling interval for live SOC updates (every 5 seconds)
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRotation = async (serviceId?: number) => {
    try {
      if (serviceId) {
        await api.rotateService(serviceId, 'Manual SOC operator trigger');
      } else {
        const webSvc = summary?.protected_services.find(s => s.service_key === 'web_server');
        if (webSvc) await api.rotateService(webSvc.id, 'Manual operator adaptation trigger');
      }
      addToast('info', 'Moving Target Defense', 'Endpoint rotated successfully. Target topology updated.');
      fetchAllData();
    } catch (err: any) {
      addToast('alert', 'Rotation Error', err.message || 'Rotation failed');
    }
  };

  const handleUnblock = async (ip: string) => {
    try {
      await api.unblockIp(ip);
      addToast('success', 'IP Unblocked', `Source IP ${ip} successfully whitelisted & unblocked.`);
      fetchAllData();
    } catch (err: any) {
      addToast('alert', 'Unblock Error', err.message || 'Unblock failed');
    }
  };

  const handleExportReport = () => {
    const reportData = {
      report_title: "IANSA Security Operations Center Incident Report",
      generated_at: new Date().toISOString(),
      system_status: "ACTIVE",
      metrics: summary?.metrics || {},
      blocked_sources: blockedSources,
      recent_events: summary?.recent_events || [],
      protected_services: summary?.protected_services || [],
      active_policy_rules: policies.rules || []
    };

    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IANSA_SOC_Security_Report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    addToast('success', 'Report Downloaded', 'SOC Incident Audit Report exported as JSON.');
  };

  const testRbacEndpoint = async (type: 'protected' | 'admin') => {
    try {
      const res = type === 'protected' ? await api.testProtectedEndpoint() : await api.testAdminEndpoint();
      setRbacTestResult(res);
      fetchAllData();
    } catch (err: any) {
      setRbacTestResult({ status: 500, data: { error: err.message } });
    }
  };

  return (
    <div className="min-h-screen bg-[#15191C] text-[#E8EEF0] flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userRole={user?.role || 'user'}
        username={user?.username || 'Guest'}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <Topbar
          user={user}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onExportReport={handleExportReport}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={async () => {
            await api.logout();
            setUser(null);
            addToast('info', 'Logged Out', 'User session terminated successfully.');
          }}
        />

        {/* Content View Container */}
        <main className="flex-1 p-8 mt-16 space-y-8">
          {loading && !summary ? (
            <div className="flex items-center justify-center h-64 text-cyan-400 font-mono text-sm space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Connecting to IANSA Central Gateway...</span>
            </div>
          ) : (
            <>
              {/* DASHBOARD TAB */}
              {activeTab === 'dashboard' && summary && (
                <div className="space-y-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      title="ACTIVE THREATS"
                      value={summary.metrics.active_threats.count.toString().padStart(2, '0')}
                      trend={summary.metrics.active_threats.trend}
                      description={summary.metrics.active_threats.description}
                      icon={ShieldAlert}
                      colorClass="text-red-400"
                    />
                    <MetricCard
                      title="BLOCKED SOURCES"
                      value={summary.metrics.blocked_sources.count.toString().padStart(2, '0')}
                      trend={summary.metrics.blocked_sources.trend}
                      description={summary.metrics.blocked_sources.description}
                      icon={ShieldCheck}
                      colorClass="text-amber-400"
                    />
                    <MetricCard
                      title="SECURITY EVENTS"
                      value={summary.metrics.total_events.count.toString().padStart(2, '0')}
                      trend={summary.metrics.total_events.trend}
                      description={summary.metrics.total_events.description}
                      icon={ListFilter}
                      colorClass="text-cyan-400"
                    />
                    <MetricCard
                      title="PROTECTED SERVICES"
                      value={summary.metrics.protected_services.count.toString().padStart(2, '0')}
                      trend={summary.metrics.protected_services.trend}
                      description={summary.metrics.protected_services.description}
                      icon={Server}
                      colorClass="text-emerald-400"
                    />
                  </div>

                  {/* Live Network & Exposure Analyzer Card */}
                  <NetworkDetectorCard data={networkDetection} onRefresh={fetchAllData} loading={loading} />

                  {/* Project Implementation Tracker */}
                  <ProjectProgress summary={trackerSummary} onOpenModule={openModule} />

                  {/* Adaptive Network Panel */}
                  <AdaptiveNetwork
                    adaptationState={summary.adaptive_network_state}
                    onRotateEndpoint={() => handleManualRotation()}
                  />

                  {/* Threat Chart & Network Status Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ThreatChart categories={summary.event_categories} />
                    </div>
                    <div>
                      <NetworkStatus />
                    </div>
                  </div>

                  {/* Protected Services Grid */}
                  <ProtectedServices
                    services={summary.protected_services}
                    onRotateService={(id) => handleManualRotation(id)}
                  />

                  {/* Live Events Stream Table */}
                  <SecurityEventTable events={summary.recent_events} onUnblockIP={handleUnblock} />

                  {/* Network Topology */}
                  <NetworkTopology />
                </div>
              )}

              {/* PROJECT TRACKER TAB */}
              {activeTab === 'tracker' && (
                selectedModule ? (
                  <ModuleDetail
                    module={selectedModule}
                    onBack={() => setSelectedModule(null)}
                    onRefresh={refreshModule}
                  />
                ) : (
                  <ProjectTracker summary={trackerSummary} onOpenModule={openModule} />
                )
              )}

              {/* THREATS TAB */}
              {activeTab === 'threats' && summary && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Threat Intelligence & Scoring</h2>
                    <p className="text-xs text-[#8D9AA0]">Deterministic threat calculation & active attack vector analysis</p>
                  </div>
                  <ThreatChart categories={summary.event_categories} />
                  <SecurityEventTable events={summary.recent_events.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL')} onUnblockIP={handleUnblock} />
                </div>
              )}

              {/* NETWORK TAB */}
              {activeTab === 'network' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Firewall & Network Environment Detection</h2>
                    <p className="text-xs text-[#8D9AA0]">Live host IP interface detection, open port exposure matrix, and active IP blackhole controls</p>
                  </div>

                  <NetworkDetectorCard data={networkDetection} onRefresh={fetchAllData} loading={loading} />

                  <div className="neu-raised p-6 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#E8EEF0]">Active Blocked IP Sources</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#23292E] text-[#8D9AA0] font-bold uppercase">
                            <th className="pb-3 px-3">IP Address</th>
                            <th className="pb-3 px-3">Trigger Reason</th>
                            <th className="pb-3 px-3">Blocked At</th>
                            <th className="pb-3 px-3">Enforcement Mode</th>
                            <th className="pb-3 px-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1F2529]">
                          {blockedSources.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-6 text-center text-[#8D9AA0]">No active IP blocks.</td>
                            </tr>
                          ) : (
                            blockedSources.map(b => (
                              <tr key={b.id}>
                                <td className="py-3 px-3 font-mono text-red-400 font-bold">{b.ip_address}</td>
                                <td className="py-3 px-3 text-[#E8EEF0]">{b.reason}</td>
                                <td className="py-3 px-3 text-[#8D9AA0]">{b.blocked_at}</td>
                                <td className="py-3 px-3 font-bold text-cyan-400">{b.block_type}</td>
                                <td className="py-3 px-3">
                                  <button
                                    onClick={() => handleUnblock(b.ip_address)}
                                    className="text-xs text-cyan-400 hover:underline font-bold"
                                  >
                                    Unblock IP
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* POLICIES TAB */}
              {activeTab === 'policies' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Adaptive Policy Engine</h2>
                    <p className="text-xs text-[#8D9AA0]">Scoring thresholds and automated decision matrix</p>
                  </div>
                  <PolicyActions rules={policies.rules} actions={policies.recent_actions} />
                </div>
              )}

              {/* PROTECTED SERVICES TAB */}
              {activeTab === 'services' && summary && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Protected Services Mesh</h2>
                    <p className="text-xs text-[#8D9AA0]">Dynamic stealth endpoint topology & service visibility</p>
                  </div>
                  <ProtectedServices
                    services={summary.protected_services}
                    onRotateService={(id) => handleManualRotation(id)}
                  />
                  <NetworkTopology />
                </div>
              )}

              {/* SECURITY EVENTS TAB */}
              {activeTab === 'events' && summary && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Security Events Audit Log</h2>
                    <p className="text-xs text-[#8D9AA0]">Normalized Suricata & Access Gateway security events</p>
                  </div>
                  <SecurityEventTable events={summary.recent_events} />
                </div>
              )}

              {/* AUTHENTICATION / RBAC TAB */}
              {activeTab === 'authentication' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Authentication Gateway & RBAC Tester</h2>
                    <p className="text-xs text-[#8D9AA0]">JWT Token Authorization & Server-side Role Enforcement</p>
                  </div>

                  {/* RBAC Tester Panel */}
                  <div className="neu-raised p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold uppercase text-[#E8EEF0]">Live Server-side RBAC Verification</h3>
                        <p className="text-xs text-[#8D9AA0]">
                          Current Session Role: <strong className="text-cyan-400 capitalize">{user?.role}</strong> ({user?.username})
                        </p>
                      </div>
                      <button
                        onClick={() => setIsLoginOpen(true)}
                        className="neu-button px-3.5 py-1.5 text-xs font-bold text-cyan-400"
                      >
                        Switch Role Account
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Protected Endpoint Test */}
                      <div className="neu-pressed p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-cyan-400">GET /api/protected</span>
                          <span className="text-[10px] font-bold text-[#8D9AA0]">Allowed: Admin, Analyst, User</span>
                        </div>
                        <button
                          onClick={() => testRbacEndpoint('protected')}
                          className="w-full py-2 neu-button text-xs font-bold text-cyan-400"
                        >
                          Test Protected Access
                        </button>
                      </div>

                      {/* Admin Endpoint Test */}
                      <div className="neu-pressed p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono text-red-400">GET /api/admin</span>
                          <span className="text-[10px] font-bold text-red-400">Allowed: Admin ONLY</span>
                        </div>
                        <button
                          onClick={() => testRbacEndpoint('admin')}
                          className="w-full py-2 neu-button text-xs font-bold text-red-400"
                        >
                          Test Admin Access
                        </button>
                      </div>
                    </div>

                    {/* Test Output */}
                    {rbacTestResult && (
                      <div className="neu-pressed p-4 space-y-2 font-mono text-xs border border-cyan-500/20">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8D9AA0]">HTTP Response Status:</span>
                          <span className={`font-bold ${rbacTestResult.status === 200 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {rbacTestResult.status} {rbacTestResult.status === 403 ? 'FORBIDDEN (Event Logged)' : rbacTestResult.status === 200 ? 'SUCCESS' : ''}
                          </span>
                        </div>
                        <pre className="text-[11px] text-[#E8EEF0] bg-[#15191C] p-3 rounded overflow-x-auto">
                          {JSON.stringify(rbacTestResult.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AUDIT LOGS TAB */}
              {activeTab === 'audit' && summary && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">Audit Trail</h2>
                    <p className="text-xs text-[#8D9AA0]">Immutable trail of policy enforcement & system events</p>
                  </div>
                  <PolicyActions rules={policies.rules} actions={policies.recent_actions} />
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-[#E8EEF0]">IANSA Platform Settings</h2>
                    <p className="text-xs text-[#8D9AA0]">Execution mode & defensive threshold configuration</p>
                  </div>

                  <div className="neu-raised p-6 space-y-4">
                    <div className="neu-pressed p-4 space-y-2">
                      <span className="text-xs font-bold text-[#8D9AA0] uppercase">Execution Mode</span>
                      <p className="text-sm font-bold text-cyan-400">SIMULATION MODE (Standalone Lab Environment)</p>
                      <p className="text-xs text-[#8D9AA0]">
                        Safe cross-platform lab execution. Network operations are persisted to SQLite database and explicitly tagged as [SIMULATION].
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <AttackSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onRefresh={fetchAllData}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          addToast('success', 'Authenticated', `Welcome back, ${u.username}!`);
          fetchAllData();
        }}
      />

      {/* Floating Notifications & AI SOC Bot */}
      <ToastNotification toasts={toasts} onDismiss={dismissToast} />
      <SOCChatbot />
    </div>
  );
};

export default App;
