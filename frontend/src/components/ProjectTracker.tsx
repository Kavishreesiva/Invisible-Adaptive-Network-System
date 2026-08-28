import React from 'react';
import type { TrackerSummary } from '../types/security';
import { Target, CheckCircle2, Circle, ClipboardList, ListTodo, CheckSquare, Square, ArrowLeft } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { getStatusColor } from '../utils/status';

interface ProjectTrackerProps {
  summary: TrackerSummary | null;
  onOpenModule: (moduleId: number) => void;
}

export const ProjectTracker: React.FC<ProjectTrackerProps> = ({ summary, onOpenModule }) => {
  if (!summary) return null;

  const overall = summary.overall_progress;
  const overallColor = getStatusColor(
    overall === 100 ? 'COMPLETED' : overall >= 80 ? 'TESTING' : overall > 0 ? 'IN PROGRESS' : 'NOT STARTED'
  );

  const overviewStats = [
    { label: 'Overall Progress', value: `${overall.toFixed(1)}%`, icon: Target, color: 'text-cyan-400' },
    { label: 'Total Modules', value: summary.modules.total, icon: ClipboardList, color: 'text-[#E8EEF0]' },
    { label: 'Completed', value: summary.modules.completed, icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Testing', value: summary.modules.testing, icon: Circle, color: 'text-amber-400' },
    { label: 'In Progress', value: summary.modules.in_progress, icon: Circle, color: 'text-cyan-400' },
    { label: 'Simulated', value: summary.modules.simulated, icon: Circle, color: 'text-orange-400' },
    { label: 'Not Started', value: summary.modules.not_started, icon: Circle, color: 'text-gray-400' },
    { label: 'Total Tasks', value: summary.tasks.total, icon: ListTodo, color: 'text-[#E8EEF0]' },
    { label: 'Completed Tasks', value: summary.tasks.completed, icon: CheckSquare, color: 'text-emerald-400' },
    { label: 'Remaining Tasks', value: summary.tasks.remaining, icon: Square, color: 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#E8EEF0]">Project Implementation Tracker</h2>
          <p className="text-xs text-[#8D9AA0]">18 IANSA modules — progress is derived automatically from detailed task statuses</p>
        </div>
        <button
          onClick={() => onOpenModule(0)}
          className="neu-button px-3.5 py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
        >
          View Modules
        </button>
      </div>

      {/* Overall progress */}
      <div className="neu-raised p-6 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8D9AA0]">Overall Project Progress</span>
          <span className={`font-mono font-extrabold text-2xl ${overallColor.text}`}>{overall.toFixed(1)}%</span>
        </div>
        <ProgressBar progress={overall} colorClass={overallColor.bar} heightClass="h-3" />
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {overviewStats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="neu-pressed p-4 flex flex-col items-center justify-center space-y-2 text-center">
              <Icon className={`w-5 h-5 ${s.color}`} />
              <span className="text-2xl font-extrabold font-mono text-[#E8EEF0]">{s.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8D9AA0]">{s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {summary.module_progress.map((mod) => {
          const colors = getStatusColor(mod.status);
          return (
            <button
              key={mod.id}
              onClick={() => onOpenModule(mod.id)}
              className="neu-raised p-5 text-left group hover:border-cyan-500/30 transition-all flex flex-col space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#E8EEF0] group-hover:text-cyan-300">{mod.name}</span>
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded ${colors.text} bg-opacity-10`}>{mod.status}</span>
              </div>
              <p className="text-[11px] text-[#8D9AA0] min-h-[28px]">{mod.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-mono font-extrabold ${colors.text}`}>{mod.progress.toFixed(1)}%</span>
                <span className="text-[10px] text-[#8D9AA0]">{mod.completed_tasks}/{mod.task_count} tasks</span>
              </div>
              <ProgressBar progress={mod.progress} colorClass={colors.bar} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-center text-[11px] text-[#8D9AA0] space-x-4">
        <span className="flex items-center space-x-1"><ArrowLeft className="w-3 h-3" /> Click a module to open its detailed task list</span>
      </div>
    </div>
  );
};
