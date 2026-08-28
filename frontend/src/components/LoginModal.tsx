import React, { useState } from 'react';
import { Lock, X, LogIn } from 'lucide-react';
import { api } from '../services/api';
import type { User } from '../types/security';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      onSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="neu-flat p-6 w-full max-w-md border border-cyan-500/30 space-y-5 relative">
        <div className="flex items-center justify-between border-b border-[#23292E] pb-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Lock className="w-5 h-5" />
            <h3 className="text-base font-bold text-[#E8EEF0]">IANSA Gateway Authentication</h3>
          </div>
          <button onClick={onClose} className="p-1 text-[#8D9AA0] hover:text-[#E8EEF0] neu-button">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-bold text-[#8D9AA0] uppercase tracking-wider block mb-2">
            Select Role Credential Preset:
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin', 'admin123')}
              className={`py-2 text-xs font-bold rounded-lg ${username === 'admin' ? 'neu-pressed text-red-400 border border-red-500/30' : 'neu-flat text-[#8D9AA0]'}`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => setPreset('analyst', 'analyst123')}
              className={`py-2 text-xs font-bold rounded-lg ${username === 'analyst' ? 'neu-pressed text-amber-400 border border-amber-500/30' : 'neu-flat text-[#8D9AA0]'}`}
            >
              Analyst
            </button>
            <button
              type="button"
              onClick={() => setPreset('user', 'user123')}
              className={`py-2 text-xs font-bold rounded-lg ${username === 'user' ? 'neu-pressed text-emerald-400 border border-emerald-500/30' : 'neu-flat text-[#8D9AA0]'}`}
            >
              User
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8D9AA0] uppercase tracking-wider mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs neu-input"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8D9AA0] uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs neu-input"
              required
            />
          </div>

          {error && (
            <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 neu-button text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Authenticate Session</span>
          </button>
        </form>
      </div>
    </div>
  );
};
