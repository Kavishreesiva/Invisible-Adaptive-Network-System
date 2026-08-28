import React, { useState } from 'react';
import { Terminal, X, Play, CheckCircle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface AttackSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const AttackSimulatorModal: React.FC<AttackSimulatorModalProps> = ({
  isOpen,
  onClose,
  onRefresh
}) => {
  const [attackType, setAttackType] = useState<string>('PORT_SCAN');
  const [sourceIp, setSourceIp] = useState<string>('10.10.10.15');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.triggerAttackSimulation(attackType, sourceIp);
      setResult(res);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="neu-flat p-6 w-full max-w-xl border border-amber-500/30 space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#23292E] pb-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <Terminal className="w-5 h-5" />
            <h3 className="text-base font-bold text-[#E8EEF0]">Lab Attack Simulation Control</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#8D9AA0] hover:text-[#E8EEF0] neu-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Simulation Form */}
        <form onSubmit={handleSimulate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8D9AA0] uppercase tracking-wider mb-2">
              Select Attack Vector
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'PORT_SCAN', name: 'Nmap SYN Port Scan', desc: 'Gateway ports 1-1024 probe' },
                { id: 'RECONNAISSANCE', name: 'Directory Recon / Fuzz', desc: 'Stealth endpoint discovery probe' },
                { id: 'AUTH_BRUTE_FORCE', name: 'Auth Brute-Force', desc: 'SSH/HTTP credential spray' },
                { id: 'MALICIOUS_REQUEST', name: 'Exploit Payload', desc: 'SQLi / Command Injection payload' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setAttackType(opt.id)}
                  className={`p-3 text-left rounded-xl transition-all ${
                    attackType === opt.id
                      ? 'neu-pressed text-amber-400 border border-amber-500/30'
                      : 'neu-flat text-[#E8EEF0] hover:bg-[#1B2024]'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.name}</p>
                  <p className="text-[10px] text-[#8D9AA0] mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8D9AA0] uppercase tracking-wider mb-1">
              Source Test IP Address
            </label>
            <input
              type="text"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono neu-input"
              placeholder="10.10.10.15"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 neu-button text-xs font-extrabold text-amber-400 hover:text-amber-300 flex items-center justify-center space-x-2 border border-amber-500/30"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Processing Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Launch Attack & Trigger Adaptation</span>
              </>
            )}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
            {error}
          </div>
        )}

        {/* Execution Output Stream */}
        {result && (
          <div className="neu-pressed p-4 space-y-2 text-xs font-mono border border-emerald-500/20">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>PIPELINE EXECUTION COMPLETE</span>
            </div>
            <div className="space-y-1 text-[#8D9AA0] pt-1">
              <p>Source IP: <strong className="text-cyan-400">{result.pipeline_result?.source_ip}</strong></p>
              <p>Calculated Threat Score: <strong className="text-red-400">{result.pipeline_result?.threat_score} / 100 ({result.pipeline_result?.severity})</strong></p>
              <p>Defensive Decision: <strong className="text-amber-400">{result.pipeline_result?.policy_action}</strong></p>
              {result.pipeline_result?.rotation_result && (
                <p className="text-emerald-400 font-bold pt-1">
                  NEW STEALTH ENDPOINT: {result.pipeline_result.rotation_result.new_endpoint}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
