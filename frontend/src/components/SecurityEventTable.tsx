import React, { useState } from 'react';
import type { SecurityEvent } from '../types/security';
import { AlertTriangle, ShieldAlert, CheckCircle, Clock, Unlock } from 'lucide-react';

interface SecurityEventTableProps {
  events: SecurityEvent[];
  onSelectSeverity?: (severity: string) => void;
  onUnblockIP?: (ip: string) => void;
}

export const SecurityEventTable: React.FC<SecurityEventTableProps> = ({ events, onUnblockIP }) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    if (severityFilter === 'ALL') return true;
    return e.severity.toUpperCase() === severityFilter;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return (
          <span className="px-2.5 py-1 text-xs font-extrabold text-red-400 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center space-x-1 w-fit">
            <AlertTriangle className="w-3 h-3 animate-pulse" />
            <span>CRITICAL</span>
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2.5 py-1 text-xs font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 rounded-lg flex items-center space-x-1 w-fit">
            <ShieldAlert className="w-3 h-3" />
            <span>HIGH</span>
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-lg w-fit block">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 text-xs font-semibold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 rounded-lg w-fit block">
            LOW
          </span>
        );
    }
  };

  const getActionBadge = (action: string) => {
    if (['BLOCK', 'QUARANTINE'].includes(action.toUpperCase())) {
      return <span className="text-xs font-bold text-red-400 neu-pressed px-2.5 py-1">{action}</span>;
    }
    if (action.toUpperCase() === 'RATE_LIMIT') {
      return <span className="text-xs font-semibold text-amber-400 neu-pressed px-2.5 py-1">{action}</span>;
    }
    return <span className="text-xs font-medium text-cyan-400 neu-pressed px-2.5 py-1">{action}</span>;
  };

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toTimeString().split(' ')[0];
    } catch {
      return ts;
    }
  };

  return (
    <div className="neu-raised p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Live Security Events Stream</h3>
          <p className="text-xs text-[#8D9AA0]">Real-time IDS & Gateway Access Logs</p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center space-x-1 neu-pressed p-1">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                severityFilter === s ? 'neu-flat text-cyan-400 font-bold' : 'text-[#8D9AA0] hover:text-[#E8EEF0]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#E8EEF0]">
          <thead>
            <tr className="border-b border-[#23292E] text-[#8D9AA0] font-bold uppercase tracking-wider">
              <th className="pb-3 px-3">Time</th>
              <th className="pb-3 px-3">Source IP</th>
              <th className="pb-3 px-3">Event Type</th>
              <th className="pb-3 px-3">Severity</th>
              <th className="pb-3 px-3">Defensive Action</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2529]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#8D9AA0]">
                  No security events matching current criteria.
                </td>
              </tr>
            ) : (
              filteredEvents.map((e) => (
                <tr key={e.id} className="hover:bg-[#1B2024] transition-colors">
                  <td className="py-3 px-3 font-mono text-[#8D9AA0] flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatTime(e.timestamp)}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-cyan-400">{e.source_ip}</td>
                  <td className="py-3 px-3 font-medium uppercase text-[#E8EEF0]">{e.event_type}</td>
                  <td className="py-3 px-3">{getSeverityBadge(e.severity)}</td>
                  <td className="py-3 px-3">{getActionBadge(e.action)}</td>
                  <td className="py-3 px-3">
                    <span className="text-xs text-emerald-400 font-semibold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{e.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {['BLOCK', 'QUARANTINE'].includes(e.action.toUpperCase()) && onUnblockIP ? (
                      <button
                        onClick={() => onUnblockIP(e.source_ip)}
                        className="neu-button px-2.5 py-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 border border-emerald-500/30"
                        title={`Unblock & Whitelist IP ${e.source_ip}`}
                      >
                        <Unlock className="w-3 h-3 text-emerald-400" />
                        <span>Unblock</span>
                      </button>
                    ) : (
                      <span className="text-[#8D9AA0] text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
