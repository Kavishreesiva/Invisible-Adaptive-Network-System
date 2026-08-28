import React, { useState, useEffect } from 'react';
import { Radio, Terminal, LogOut, LogIn, FileText } from 'lucide-react';
import type { User } from '../types/security';

interface TopbarProps {
  user: User | null;
  onOpenSimulator: () => void;
  onExportReport: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  onOpenSimulator,
  onExportReport,
  onOpenLogin,
  onLogout
}) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0] + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#15191C] fixed top-0 right-0 left-64 z-10 px-8 flex items-center justify-between border-b border-[#1B2024]">
      {/* Title & Status */}
      <div className="flex items-center space-x-6">
        <div>
          <h2 className="text-base font-bold text-[#E8EEF0] tracking-wide">
            IANSA Security Operations Center
          </h2>
        </div>

        {/* System Active Badge */}
        <div className="neu-pressed px-3 py-1.5 flex items-center space-x-2 text-xs font-semibold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Clock Ticker */}
        <div className="neu-flat px-3 py-1.5 text-xs font-mono text-[#8D9AA0] flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{time}</span>
        </div>

        {/* Export SOC Incident Report */}
        <button
          onClick={onExportReport}
          className="neu-button px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1.5 border border-emerald-500/20"
          title="Export SOC Security Incident Report (JSON/Audit)"
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Export Report</span>
        </button>

        {/* Attack Simulator Launcher */}
        <button
          onClick={onOpenSimulator}
          className="neu-button px-3.5 py-2 text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 border border-amber-500/20"
        >
          <Terminal className="w-4 h-4 text-amber-400" />
          <span>Simulate Attack</span>
        </button>

        {/* Login / Logout */}
        {user ? (
          <button
            onClick={onLogout}
            className="neu-button px-3.5 py-2 text-xs font-medium text-red-400 hover:text-red-300 flex items-center space-x-1.5"
            title="Logout session"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="neu-button px-3.5 py-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Authenticate</span>
          </button>
        )}
      </div>
    </header>
  );
};
