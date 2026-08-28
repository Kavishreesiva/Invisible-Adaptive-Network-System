import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ThreatChartProps {
  categories: {
    reconnaissance: number;
    port_scans: number;
    auth_failures: number;
    suspicious_traffic: number;
  };
}

export const ThreatChart: React.FC<ThreatChartProps> = ({ categories }) => {
  const [filter, setFilter] = useState<'1H' | '6H' | '24H' | '7D'>('24H');

  // Generate responsive sample time series based on live categories count
  const data = [
    { time: '00:00', reconnaissance: Math.max(1, Math.round(categories.reconnaissance * 0.2)), port_scans: Math.max(0, categories.port_scans - 2), auth_failures: categories.auth_failures },
    { time: '04:00', reconnaissance: Math.round(categories.reconnaissance * 0.4), port_scans: categories.port_scans, auth_failures: categories.auth_failures + 1 },
    { time: '08:00', reconnaissance: Math.round(categories.reconnaissance * 0.8), port_scans: categories.port_scans + 1, auth_failures: Math.max(0, categories.auth_failures - 1) },
    { time: '12:00', reconnaissance: categories.reconnaissance + 2, port_scans: categories.port_scans + 3, auth_failures: categories.auth_failures + 2 },
    { time: '16:00', reconnaissance: Math.round(categories.reconnaissance * 1.2), port_scans: categories.port_scans + 2, auth_failures: categories.auth_failures + 1 },
    { time: '20:00', reconnaissance: categories.reconnaissance, port_scans: categories.port_scans, auth_failures: categories.auth_failures }
  ];

  return (
    <div className="neu-raised p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Threat Activity Trends</h3>
          <p className="text-xs text-[#8D9AA0]">Reconnaissance, Port Scans & Auth Violations over time</p>
        </div>

        {/* Time Filter Controls */}
        <div className="flex items-center space-x-1 neu-pressed p-1">
          {(['1H', '6H', '24H', '7D'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                filter === t ? 'neu-flat text-cyan-400 font-bold' : 'text-[#8D9AA0] hover:text-[#E8EEF0]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRecon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorScan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
              </linearGradient>
              <linearGradient id="colorAuth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#23292E" vertical={false} />
            <XAxis dataKey="time" stroke="#8D9AA0" tick={{ fontSize: 11 }} />
            <YAxis stroke="#8D9AA0" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1B2024', borderColor: '#23292E', borderRadius: '10px', color: '#E8EEF0' }}
            />
            <Area type="monotone" dataKey="reconnaissance" name="Reconnaissance" stroke="#06B6D4" fillOpacity={1} fill="url(#colorRecon)" />
            <Area type="monotone" dataKey="port_scans" name="Port Scans" stroke="#EF4444" fillOpacity={1} fill="url(#colorScan)" />
            <Area type="monotone" dataKey="auth_failures" name="Auth Failures" stroke="#F59E0B" fillOpacity={1} fill="url(#colorAuth)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center space-x-6 mt-4 text-xs font-medium text-[#8D9AA0]">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-cyan-400" />
          <span>Reconnaissance ({categories.reconnaissance})</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span>Port Scans ({categories.port_scans})</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Auth Failures ({categories.auth_failures})</span>
        </div>
      </div>
    </div>
  );
};
