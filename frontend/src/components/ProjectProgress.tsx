import React from 'react';
import type { TrackerSummary } from '../types/security';
import { Target, CheckCircle2, Circle, ListTodo, CheckSquare, Square, ClipboardList, ChevronRight } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { getStatusColor } from '../utils/status';

interface ProjectProgressProps {
  summary: TrackerSummary | null;
  onOpenModule?: (moduleId: number) => void;
}

export const ProjectProgress: React.FC<ProjectProgressProps> = ({ summary, onOpenModule }) => {
  if (!summary) return null;

  const overall = summary.overall_progress;
  const overallColor = getStatusColor(
    overall === 100 ? 'COMPLETED' : overall >= 80 ? 'TESTING' : overall > 0 ? 'IN PROGRESS' : 'NOT STARTED'
  );

  const stats = [
    { label: 'Overall Progress', value: `${overall.toFixed(1)}%`, icon: Target, color: 'text-cyan-400' },
    { label: 'Completed Modules', value: summary.modules.completed, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Modules In Progress', value: summary.modules.in_progress, icon: Circle, color: 'text-amber-400' },
    { label: 'Pending Modules', value: summary.modules.not_started, icon: ClipboardList, color: 'text-gray-400' },
    { label: 'Total Tasks', value: summary.tasks.total, icon: ListTodo, color: 'text-[#E8EEF0]' },
    { label: 'Completed Tasks', value: summary.tasks.completed, icon: CheckSquare, color: 'text-emerald-400' },
    { label: 'Remaining Tasks', value: summary.tasks.remaining, icon: Square, color: 'text-red-400' },
  ];

  return (
    <div className="neu-raised p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 neu-pressed text-cyan-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Project Implementation Tracker</h3>
            <p className="text-xs text-[#8D9AA0]">Automatic progress from detailed module tasks</p>
          </div>
        </div>
        {onOpenModule && (
          <button
            onClick={() => onOpenModule(0)}
            className="neu-button px-3.5 py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
          >
            Open Tracker
          </button>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="neu-pressed p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-wider text-[#8D9AA0]">Overall Project Progress</span>
          <span className={`font-mono font-extrabold text-lg ${overallColor.text}`}>{overall.toFixed(1)}%</span>
        </div>
        <ProgressBar progress={overall} colorClass={overallColor.bar} heightClass="h-3" />
      </div>

      {/* KPI stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="neu-pressed p-3 flex flex-col items-center justify-center space-y-1.5 text-center">
              <Icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-lg font-extrabold font-mono text-[#E8EEF0]">{s.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D9AA0]">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Module progress list */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#8D9AA0]">Module Progress</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {summary.module_progress.map((mod) => {
            const colors = getStatusColor(mod.status);
            return (
              <button
                key={mod.id}
                onClick={() => onOpenModule && onOpenModule(mod.id)}
                className="neu-pressed p-3.5 text-left group hover:border-cyan-500/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#E8EEF0] group-hover:text-cyan-300 flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span>{mod.name}</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className={`text-[11px] font-mono font-bold ${colors.text}`}>{mod.progress.toFixed(1)}%</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${colors.text}`}>{mod.status}</span>
                  </span>
                </div>
                <ProgressBar progress={mod.progress} colorClass={colors.bar} />
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#8D9AA0]">
                    {mod.completed_tasks}/{mod.task_count} completed
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#8D9AA0] group-hover:text-cyan-400" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
