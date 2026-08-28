import React from 'react';

interface ProgressBarProps {
  progress: number;
  colorClass?: string;
  heightClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  colorClass = 'bg-cyan-400',
  heightClass = 'h-2'
}) => {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <div className={`w-full ${heightClass} neu-pressed rounded-full overflow-hidden`}>
      <div
        className={`${heightClass} ${colorClass} rounded-full transition-all duration-500`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};
