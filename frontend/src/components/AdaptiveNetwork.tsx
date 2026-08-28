import React from 'react';
import type { EndpointRotation } from '../types/security';
import { RefreshCw, ArrowRight, Zap, Lock, AlertTriangle } from 'lucide-react';

interface AdaptiveNetworkProps {
  adaptationState: {
    status: string;
    latest_adaptation: EndpointRotation;
  };
  onRotateEndpoint?: () => void;
}

export const AdaptiveNetwork: React.FC<AdaptiveNetworkProps> = ({ adaptationState, onRotateEndpoint }) => {
  const latest = adaptationState.latest_adaptation || {
    service_name: 'Web Server',
    new_endpoint: 'service-91af32.internal',
    previous_endpoint: 'service-a.internal',
    timestamp: new Date().toISOString(),
    reason: 'Reconnaissance probe detected on public gateway',
    mode: 'SIMULATION'
  };

  const steps = [
    { title: '1. Threat Detected', desc: 'Suricata IDS / Auth Audit', icon: AlertTriangle },
    { title: '2. Threat Analysis', desc: 'Deterministic Scoring (0-100)', icon: Zap },
    { title: '3. Policy Decision', desc: 'Adaptive Policy Evaluation', icon: Lock },
    { title: '4. Network Adaptation', desc: 'Dynamic Endpoint Rotation', icon: RefreshCw },
  ];

  return (
    <div className="neu-raised p-6 flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Adaptive Network Control</h3>
            <span className="px-2 py-0.5 text-[10px] font-extrabold text-cyan-400 neu-pressed uppercase tracking-wider">
              {latest.mode || 'SIMULATION'}
            </span>
          </div>
          <p className="text-xs text-[#8D9AA0]">Moving Target Defense & Service Endpoint Mutation Engine</p>
        </div>

        {onRotateEndpoint && (
          <button
            onClick={onRotateEndpoint}
            className="neu-button px-3.5 py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Rotate Endpoint Now</span>
          </button>
        )}
      </div>

      {/* Step Diagram */}
      <div className="grid grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={step.title} className="neu-pressed p-3 flex flex-col justify-between relative">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-cyan-400">{step.title}</span>
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-[10px] text-[#8D9AA0] mt-2">{step.desc}</p>
              {idx < 3 && (
                <ArrowRight className="w-3 h-3 text-[#8D9AA0] absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden md:block" />
              )}
            </div>
          );
        })}
      </div>

      {/* Endpoint Adaptation Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Previous vs Current Endpoint */}
        <div className="neu-pressed p-4 space-y-3">
          <span className="text-xs font-bold text-[#8D9AA0] uppercase tracking-wider">Active Endpoint Status</span>
          <div className="space-y-2 mt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8D9AA0]">Previous Endpoint:</span>
              <span className="font-mono text-red-400 line-through">{latest.previous_endpoint}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#23292E]">
              <span className="text-[#8D9AA0] font-medium">Current Active Endpoint:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {latest.new_endpoint}
              </span>
            </div>
          </div>
        </div>

        {/* Adaptation Event Metadata */}
        <div className="neu-pressed p-4 space-y-3">
          <span className="text-xs font-bold text-[#8D9AA0] uppercase tracking-wider">Adaptation Audit</span>
          <div className="space-y-2 mt-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8D9AA0]">Target Service:</span>
              <span className="font-semibold text-[#E8EEF0]">{latest.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8D9AA0]">Trigger Reason:</span>
              <span className="font-medium text-amber-400 truncate max-w-[200px]" title={latest.reason}>
                {latest.reason}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8D9AA0]">Action Executed:</span>
              <span className="font-bold text-cyan-400">ENDPOINT ROTATION</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
