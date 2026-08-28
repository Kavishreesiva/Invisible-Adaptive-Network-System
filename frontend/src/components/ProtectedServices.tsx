import React from 'react';
import type { ProtectedService } from '../types/security';
import { EyeOff, Lock, Globe, Server } from 'lucide-react';

interface ProtectedServicesProps {
  services: ProtectedService[];
  onRotateService?: (serviceId: number) => void;
}

export const ProtectedServices: React.FC<ProtectedServicesProps> = ({ services, onRotateService }) => {
  const getVisibilityBadge = (visibility: string) => {
    switch (visibility.toUpperCase()) {
      case 'HIDDEN':
        return (
          <span className="px-2 py-0.5 text-[10px] font-extrabold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded flex items-center space-x-1">
            <EyeOff className="w-3 h-3" />
            <span>HIDDEN</span>
          </span>
        );
      case 'PROTECTED':
        return (
          <span className="px-2 py-0.5 text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded flex items-center space-x-1">
            <Lock className="w-3 h-3" />
            <span>PROTECTED</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center space-x-1">
            <Globe className="w-3 h-3" />
            <span>PUBLIC</span>
          </span>
        );
    }
  };

  return (
    <div className="neu-raised p-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Protected Stealth Services</h3>
        <p className="text-xs text-[#8D9AA0]">Application & Database Services Mesh</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map((svc) => (
          <div key={svc.id} className="neu-pressed p-4 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="p-2 neu-flat text-emerald-400">
                <Server className="w-4 h-4" />
              </div>
              {getVisibilityBadge(svc.visibility)}
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#E8EEF0] flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{svc.name}</span>
              </h4>
              <p className="text-[11px] font-mono text-cyan-400 mt-1 truncate" title={svc.current_endpoint}>
                {svc.current_endpoint}
              </p>
            </div>

            <div className="pt-2 border-t border-[#23292E] flex items-center justify-between text-[11px]">
              <span className="text-[#8D9AA0]">Port: {svc.port}</span>
              {onRotateService && (
                <button
                  onClick={() => onRotateService(svc.id)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline"
                >
                  Rotate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
