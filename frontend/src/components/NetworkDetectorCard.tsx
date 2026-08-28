import React from 'react';
import { Wifi, ShieldCheck, Activity, Layers, Radio, Globe, RefreshCw } from 'lucide-react';

export interface NetworkDetectionData {
  status: string;
  current_ip: string;
  previous_ip: string;
  ip_changed: boolean;
  network_name: string;
  network_type: string;
  hostname: string;
  operating_system: string;
  last_change_time: string;
  exposure_level: string;
  open_services: {
    port: number;
    service: string;
    status: string;
    exposure: string;
  }[];
  transition_history: {
    timestamp: string;
    from_ip: string;
    to_ip: string;
    network: string;
  }[];
}

interface NetworkDetectorCardProps {
  data: NetworkDetectionData | null;
  onRefresh: () => void;
  loading?: boolean;
}

export const NetworkDetectorCard: React.FC<NetworkDetectorCardProps> = ({ data, onRefresh, loading }) => {
  if (!data) return null;

  const isHomeOrPg = data.network_type === 'HOME_PG_WIFI';
  const isEnterprise = data.network_type === 'ENTERPRISE_WIFI';

  return (
    <div className="neu-raised p-6 flex flex-col space-y-6">
      {/* Top Title & Network Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#23292E] pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 neu-pressed rounded-xl text-cyan-400">
            <Wifi className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">
                Live Network & Exposure Analyzer
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded flex items-center space-x-1">
                <Radio className="w-2.5 h-2.5 animate-ping text-emerald-400" />
                <span>REAL-TIME DETECTED</span>
              </span>
            </div>
            <p className="text-xs text-[#8D9AA0] mt-0.5">
              Host: <strong className="text-[#E8EEF0]">{data.hostname}</strong> ({data.operating_system})
            </p>
          </div>
        </div>

        {/* Refresh & Active Network Badge */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="neu-button p-2 text-[#8D9AA0] hover:text-[#E8EEF0]"
            title="Force Network Re-detection"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <div className="neu-pressed px-4 py-2 flex flex-col items-end">
            <span className="text-[10px] text-[#8D9AA0] font-bold uppercase tracking-wider">Active IP Address</span>
            <span className="font-mono text-sm font-extrabold text-cyan-400">{data.current_ip}</span>
          </div>
        </div>
      </div>

      {/* Network Environment Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Network Classification */}
        <div className="neu-pressed p-4 space-y-1">
          <span className="text-[10px] text-[#8D9AA0] font-bold uppercase tracking-wider flex items-center space-x-1">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Detected Environment</span>
          </span>
          <p className="text-xs font-bold text-[#E8EEF0]">{data.network_name}</p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded ${
              isEnterprise
                ? 'text-purple-400 bg-purple-500/15'
                : isHomeOrPg
                ? 'text-blue-400 bg-blue-500/15'
                : 'text-cyan-400 bg-cyan-500/15'
            }`}
          >
            {data.network_type}
          </span>
        </div>

        {/* System Exposure Level */}
        <div className="neu-pressed p-4 space-y-1">
          <span className="text-[10px] text-[#8D9AA0] font-bold uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local Exposure Rating</span>
          </span>
          <p className="text-xs font-extrabold text-emerald-400">{data.exposure_level} RISK</p>
          <p className="text-[11px] text-[#8D9AA0]">
            {data.open_services.length} Local Services Listening
          </p>
        </div>

        {/* Transition State */}
        <div className="neu-pressed p-4 space-y-1">
          <span className="text-[10px] text-[#8D9AA0] font-bold uppercase tracking-wider flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Network Transition State</span>
          </span>
          <p className="text-xs font-bold text-[#E8EEF0]">
            {data.ip_changed ? '⚠ IP RECENTLY CHANGED' : 'STABLE CONNECTION'}
          </p>
          <p className="text-[11px] text-[#8D9AA0] font-mono truncate">
            Prev IP: {data.previous_ip}
          </p>
        </div>
      </div>

      {/* Local Service Exposure Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-[#E8EEF0] uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Host Service Exposure Matrix ({data.open_services.length})</span>
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {data.open_services.map((svc) => (
            <div key={svc.port} className="neu-pressed p-3 flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-extrabold text-cyan-400">Port {svc.port}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 rounded">
                  {svc.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#E8EEF0] truncate">{svc.service}</p>
                <p className="text-[10px] text-[#8D9AA0] capitalize mt-0.5">{svc.exposure.replace('_', ' ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network IP Transition History Log */}
      {data.transition_history.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#23292E]">
          <h4 className="text-[11px] font-bold text-[#8D9AA0] uppercase tracking-wider">
            Network Environment Transition History
          </h4>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {data.transition_history.map((hist, idx) => (
              <div key={idx} className="neu-pressed p-2 text-[11px] font-mono flex items-center justify-between">
                <span className="text-[#8D9AA0]">{hist.timestamp.split('T')[1]?.split('.')[0] || hist.timestamp}</span>
                <span className="text-[#E8EEF0]">{hist.network}</span>
                <span className="text-cyan-400 font-bold">
                  {hist.from_ip} &rarr; {hist.to_ip}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
