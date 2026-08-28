import React from 'react';
import { Cpu, ShieldCheck, Eye, CpuIcon, Database, Server } from 'lucide-react';

interface ComponentItem {
  name: string;
  status: 'ONLINE' | 'ACTIVE' | 'WARNING' | 'OFFLINE';
  detail: string;
  icon: any;
}

export const NetworkStatus: React.FC = () => {
  const components: ComponentItem[] = [
    { name: 'IANSA Gateway', status: 'ONLINE', detail: 'Authentication & Access Gateway', icon: Cpu },
    { name: 'nftables Firewall', status: 'ACTIVE', detail: 'Linux Native / Simulation Blackhole', icon: ShieldCheck },
    { name: 'Suricata IDS Engine', status: 'ACTIVE', detail: 'Packet & Log Inspection active', icon: Eye },
    { name: 'Policy Engine', status: 'ACTIVE', detail: 'Deterministic Scoring Model', icon: CpuIcon },
    { name: 'Security Database', status: 'ONLINE', detail: 'SQLite / PostgreSQL Store', icon: Database },
    { name: 'Protected Mesh', status: 'ACTIVE', detail: 'Dynamic Stealth Endpoints', icon: Server },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">{status}</span>;
      case 'WARNING':
        return <span className="px-2.5 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg">{status}</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold text-gray-400 bg-gray-500/10 border border-gray-500/20 rounded-lg">{status}</span>;
    }
  };

  return (
    <div className="neu-raised p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Network Health & Status</h3>
        <p className="text-xs text-[#8D9AA0]">Infrastructure Subsystems & Defensive Engines</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {components.map((comp) => {
          const Icon = comp.icon;
          return (
            <div key={comp.name} className="neu-pressed p-4 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2 neu-flat text-cyan-400">
                  <Icon className="w-4 h-4" />
                </div>
                {getStatusBadge(comp.status)}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#E8EEF0]">{comp.name}</h4>
                <p className="text-[11px] text-[#8D9AA0] mt-0.5">{comp.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
