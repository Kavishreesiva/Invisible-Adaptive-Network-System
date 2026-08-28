import React from 'react';
import { Laptop, ShieldAlert, Cpu, Lock, Server, Database, ArrowDown } from 'lucide-react';

export const NetworkTopology: React.FC = () => {
  return (
    <div className="neu-raised p-6 flex flex-col space-y-6">
      <div>
        <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Network Architecture Topology</h3>
        <p className="text-xs text-[#8D9AA0]">IANSA Central Gateway & Protected Stealth Mesh Architecture</p>
      </div>

      <div className="neu-pressed p-6 flex flex-col items-center space-y-6 relative overflow-hidden">
        {/* Test Client Node */}
        <div className="neu-flat p-4 w-64 text-center flex flex-col items-center space-y-2 border border-red-500/20">
          <div className="p-2.5 neu-pressed text-red-400">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#E8EEF0]">TEST CLIENT / KALI LINUX</h4>
            <p className="text-[10px] text-[#8D9AA0] font-mono">10.10.10.15 (External Untrusted)</p>
          </div>
        </div>

        <ArrowDown className="w-5 h-5 text-cyan-400 animate-bounce" />

        {/* Central IANSA Gateway Box */}
        <div className="neu-flat p-5 w-full max-w-2xl border border-cyan-500/30">
          <div className="flex items-center justify-between pb-3 border-b border-[#23292E] mb-4">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h4 className="text-sm font-extrabold text-[#E8EEF0]">IANSA CENTRAL GATEWAY</h4>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 rounded">
              CONTROL POINT ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="neu-pressed p-3 flex flex-col items-center">
              <Lock className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-[11px] font-bold text-[#E8EEF0]">Authentication</span>
              <span className="text-[9px] text-[#8D9AA0]">JWT & Hashing</span>
            </div>
            <div className="neu-pressed p-3 flex flex-col items-center">
              <ShieldAlert className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-[#E8EEF0]">RBAC Control</span>
              <span className="text-[9px] text-[#8D9AA0]">Role Enforcement</span>
            </div>
            <div className="neu-pressed p-3 flex flex-col items-center">
              <Cpu className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[11px] font-bold text-[#E8EEF0]">nftables Firewall</span>
              <span className="text-[9px] text-[#8D9AA0]">Blackhole Rules</span>
            </div>
            <div className="neu-pressed p-3 flex flex-col items-center">
              <Server className="w-4 h-4 text-orange-400 mb-1" />
              <span className="text-[11px] font-bold text-[#E8EEF0]">Suricata IDS</span>
              <span className="text-[9px] text-[#8D9AA0]">Log Inspection</span>
            </div>
          </div>
        </div>

        <ArrowDown className="w-5 h-5 text-cyan-400" />

        {/* Protected Stealth Network Zone */}
        <div className="w-full max-w-2xl text-center space-y-2">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded">
            Protected Stealth Zone (Hidden Mesh)
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
            <div className="neu-flat p-4 flex flex-col items-center space-y-2 border border-emerald-500/20">
              <Server className="w-5 h-5 text-emerald-400" />
              <h5 className="text-xs font-bold text-[#E8EEF0]">Web Server</h5>
              <p className="text-[9px] font-mono text-cyan-400">service-91af32.internal</p>
            </div>

            <div className="neu-flat p-4 flex flex-col items-center space-y-2 border border-emerald-500/20">
              <Server className="w-5 h-5 text-emerald-400" />
              <h5 className="text-xs font-bold text-[#E8EEF0]">App Server</h5>
              <p className="text-[9px] font-mono text-cyan-400">app-74c2e1.internal</p>
            </div>

            <div className="neu-flat p-4 flex flex-col items-center space-y-2 border border-emerald-500/20">
              <Database className="w-5 h-5 text-emerald-400" />
              <h5 className="text-xs font-bold text-[#E8EEF0]">Protected Database</h5>
              <p className="text-[9px] font-mono text-cyan-400">db-sub-90a.internal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
