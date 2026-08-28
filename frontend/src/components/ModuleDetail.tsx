import React, { useState } from 'react';
import type { ProjectModule, ProjectTask, TaskStatus } from '../types/security';
import { ArrowLeft, CheckSquare, Square, RefreshCw } from 'lucide-react';
import { ProgressBar } from './ProgressBar';
import { getStatusColor } from '../utils/status';
import { api } from '../services/api';

interface ModuleDetailProps {
  module: ProjectModule | null;
  onBack: () => void;
  onRefresh: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'IMPLEMENTED', label: 'IMPLEMENTED', color: 'text-emerald-400' },
  { value: 'PARTIAL', label: 'PARTIAL', color: 'text-amber-400' },
  { value: 'SIMULATED', label: 'SIMULATED', color: 'text-orange-400' },
  { value: 'NOT_IMPLEMENTED', label: 'NOT IMPLEMENTED', color: 'text-gray-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'text-red-400',
  MEDIUM: 'text-amber-400',
  LOW: 'text-cyan-400',
};

export const ModuleDetail: React.FC<ModuleDetailProps> = ({ module, onBack, onRefresh }) => {
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!module) return null;

  const updateStatus = async (task: ProjectTask, status: TaskStatus) => {
    setUpdatingId(task.id);
    setError(null);
    try {
      await api.updateTask(task.id, { status });
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update task');
    } finally {
      setUpdatingId(null);
    }
  };

  const colors = getStatusColor(module.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="neu-button px-3.5 py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center space-x-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tracker</span>
        </button>
        <button
          onClick={onRefresh}
          className="neu-button px-3.5 py-1.5 text-xs font-bold text-[#8D9AA0] hover:text-[#E8EEF0] flex items-center space-x-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Module summary */}
      <div className="neu-raised p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">{module.key.replace(/_/g, ' ')}</span>
            </div>
            <h2 className="text-lg font-bold text-[#E8EEF0]">{module.name}</h2>
            <p className="text-xs text-[#8D9AA0]">{module.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <span className={`font-mono font-extrabold text-2xl ${colors.text}`}>{module.progress.toFixed(1)}%</span>
            <span className={`text-[10px] font-extrabold px-2 py-1 rounded ${colors.text}`}>{module.status}</span>
          </div>
        </div>
        <ProgressBar progress={module.progress} colorClass={colors.bar} heightClass="h-3" />
        <div className="flex items-center justify-between text-[11px] text-[#8D9AA0]">
          <span>
            {module.completed_tasks}/{module.task_count} completed
            {module.partial_tasks > 0 && <span className="ml-2 text-amber-400">{module.partial_tasks} partial</span>}
            {module.simulated_tasks > 0 && <span className="ml-2 text-orange-400">{module.simulated_tasks} simulated</span>}
          </span>
          <span className="text-red-400 font-semibold">{module.remaining_tasks} remaining</span>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">{error}</div>
      )}

      {/* Task list */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#E8EEF0] uppercase tracking-wider">Module Tasks</h3>
        {module.tasks && module.tasks.length === 0 && (
          <div className="neu-pressed p-8 text-center text-xs text-[#8D9AA0]">No tasks defined for this module.</div>
        )}
        {module.tasks?.map((task) => {
          const isCompleted = task.status === 'IMPLEMENTED';
          const statusColor = STATUS_OPTIONS.find((s) => s.value === task.status)?.color || 'text-gray-400';
          return (
            <div key={task.id} className={`neu-raised p-4 space-y-3 ${isCompleted ? 'border-l-2 border-emerald-500/60' : 'border-l-2 border-[#23292E]'}`}>
              <div className="flex items-start justify-between gap-4">
                {/* Checkbox toggle */}
                <button
                  onClick={() => updateStatus(task, isCompleted ? 'NOT_IMPLEMENTED' : 'IMPLEMENTED')}
                  disabled={updatingId === task.id}
                  className={`shrink-0 ${isCompleted ? 'text-emerald-400' : 'text-[#8D9AA0] hover:text-cyan-400'}`}
                  title={isCompleted ? 'Mark not implemented' : 'Mark implemented'}
                >
                  {isCompleted ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-emerald-400' : 'text-[#E8EEF0]'}`}>
                      {task.title}
                    </h4>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${PRIORITY_COLORS[task.priority] || 'text-cyan-400'}`}>
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-[#8D9AA0] mt-1">{task.description}</p>
                  )}
                  {task.remarks && (
                    <p className="text-[11px] text-[#6B7A82] mt-1 italic">{task.remarks}</p>
                  )}
                </div>

                {/* Status selector */}
                <div className="flex items-center space-x-2 shrink-0">
                  {updatingId === task.id && <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />}
                  <select
                    value={task.status}
                    onChange={(e) => updateStatus(task, e.target.value as TaskStatus)}
                    disabled={updatingId === task.id}
                    className={`neu-input px-2 py-1.5 text-[11px] font-bold ${statusColor} cursor-pointer`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#1B2024] text-[#E8EEF0]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
