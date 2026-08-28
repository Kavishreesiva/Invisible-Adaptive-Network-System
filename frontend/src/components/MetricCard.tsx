import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  trend: string;
  description: string;
  icon: LucideIcon;
  colorClass?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  description,
  icon: Icon,
  colorClass = 'text-cyan-400'
}) => {
  const isRed = colorClass.includes('red');
  const isAmber = colorClass.includes('amber');
  const isEmerald = colorClass.includes('emerald');

  const borderHover = isRed
    ? 'hover:border-red-500/40 hover:shadow-red-500/10'
    : isAmber
    ? 'hover:border-amber-500/40 hover:shadow-amber-500/10'
    : isEmerald
    ? 'hover:border-emerald-500/40 hover:shadow-emerald-500/10'
    : 'hover:border-cyan-500/40 hover:shadow-cyan-500/10';

  return (
    <div className={`neu-raised p-6 flex flex-col justify-between group transition-all duration-300 ${borderHover}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-[#8D9AA0] group-hover:text-[#E8EEF0] transition-colors">
          {title}
        </span>
        <div className={`p-3 neu-pressed rounded-xl ${colorClass} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-5">
        <div className="text-4xl font-extrabold text-[#E8EEF0] font-mono tracking-tight group-hover:translate-x-1 transition-transform">
          {value}
        </div>
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#23292E]">
          <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md neu-pressed ${colorClass}`}>
            {trend}
          </span>
          <span className="text-[11px] text-[#8D9AA0] font-medium truncate max-w-[150px]" title={description}>
            {description}
          </span>
        </div>
      </div>
    </div>
  );
};
