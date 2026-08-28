import React from 'react';
import type { PolicyRule, PolicyAction } from '../types/security';
import { Sliders, ShieldAlert } from 'lucide-react';

interface PolicyActionsProps {
  rules: PolicyRule[];
  actions: PolicyAction[];
}

export const PolicyActions: React.FC<PolicyActionsProps> = ({ rules, actions }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Rules */}
      <div className="neu-raised p-6 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Adaptive Policy Rules</h3>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="neu-pressed p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#E8EEF0]">{rule.name}</h4>
                <span className="px-2 py-0.5 text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 rounded">
                  Score Threshold: {rule.threshold_score}+
                </span>
              </div>
              <p className="text-xs text-[#8D9AA0]">{rule.description}</p>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-[#8D9AA0]">Condition: {rule.condition_type}</span>
                <span className="font-bold text-amber-400">Action: {rule.action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Execution History */}
      <div className="neu-raised p-6 flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Policy Engine Execution Log</h3>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
          {actions.length === 0 ? (
            <p className="text-xs text-[#8D9AA0] text-center py-6">No policy actions executed yet.</p>
          ) : (
            actions.map((act) => (
              <div key={act.id} className="neu-pressed p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-bold">{act.source_ip}</span>
                  <span className="font-mono text-[#8D9AA0]">{act.timestamp ? act.timestamp.split('T')[1]?.split('.')[0] : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8D9AA0]">Threat Score: <strong className="text-red-400">{act.threat_score}</strong></span>
                  <span className="font-extrabold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">{act.action_taken}</span>
                </div>
                <p className="text-[11px] text-[#8D9AA0] truncate" title={act.trigger_reason}>
                  {act.trigger_reason}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
