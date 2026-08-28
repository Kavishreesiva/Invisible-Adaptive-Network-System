import React from 'react';
import { 
  ShieldAlert, 
  Activity, 
  Network, 
  Sliders, 
  Server, 
  ListFilter, 
  Key, 
  FileText, 
  Settings,
  Lock,
  Target,
  ChevronRight
} from 'lucide-react';
import type { UserRole } from '../types/security';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  username: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  userRole,
  username
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'tracker', label: 'Project Tracker', icon: Target },
    { id: 'threats', label: 'Threats', icon: ShieldAlert },
    { id: 'network', label: 'Network & IP', icon: Network },
    { id: 'policies', label: 'Adaptive Policies', icon: Sliders },
    { id: 'services', label: 'Protected Services', icon: Server },
    { id: 'events', label: 'Security Events', icon: ListFilter },
    { id: 'authentication', label: 'Authentication', icon: Key },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#121619] h-screen fixed left-0 top-0 p-5 flex flex-col justify-between border-r border-[#1F252A] z-20">
      <div>
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-8 px-2 pt-1">
          <div className="p-2.5 neu-raised text-cyan-400 border border-cyan-500/30 cyber-glow-cyan">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-[#E8EEF0] tracking-wide font-mono">IANSA</h1>
            <p className="text-[11px] text-[#8D9AA0] font-semibold tracking-wide">Adaptive Network SOC</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'neu-pressed text-cyan-400 border-l-4 border-l-cyan-400 font-extrabold'
                    : 'text-[#8D9AA0] hover:text-[#E8EEF0] hover:bg-[#181D21]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-[#8D9AA0]'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session Footer */}
      <div className="neu-raised p-3.5 flex items-center space-x-3 border border-[#232A30]">
        <div className="w-10 h-10 rounded-xl neu-pressed flex items-center justify-center font-extrabold text-cyan-400 font-mono text-sm uppercase border border-cyan-500/20">
          {username.substring(0, 2)}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-xs font-extrabold text-[#E8EEF0] truncate font-mono">{username}</p>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${
              userRole === 'admin' ? 'bg-red-500 animate-ping' : userRole === 'analyst' ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
            <span className="text-[10px] text-[#8D9AA0] font-bold uppercase tracking-wider">{userRole} ROLE</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
