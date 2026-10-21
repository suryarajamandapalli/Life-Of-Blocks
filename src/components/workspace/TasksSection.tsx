import React, { useState } from 'react';
import { Task, Priority, AccentColor } from '../../types';
import { GlassButton } from '../ui/GlassButton';
import {
  Check,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';
import confetti from 'canvas-confetti';

interface TasksSectionProps {
  blockId: string;
  accent: AccentColor;
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksSection: React.FC<TasksSectionProps> = ({
  blockId,
  tasks,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundService.playTap();
    hapticsService.light();

    onAddTask({
      blockId,
      title: newTitle.trim(),
      completed: false,
      priority,
      dueDate: dueDate || undefined,
    });

    setNewTitle('');
    setDueDate('');
    setShowAdvanced(false);
  };

  const handleToggle = (task: Task) => {
    const isNowCompleted = !task.completed;
    if (isNowCompleted) {
      soundService.playTaskComplete();
      hapticsService.success();

      // Check if all remaining tasks are now complete
      const otherUncompleted = tasks.filter((t) => t.id !== task.id && !t.completed);
      if (otherUncompleted.length === 0 && tasks.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#38bdf8', '#818cf8', '#34d399', '#f472b6'],
        });
      }
    } else {
      soundService.playTap();
      hapticsService.light();
    }
    onToggleTask(task.id);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const priorityColors: Record<Priority, { label: string; class: string }> = {
    urgent: { label: 'Urgent', class: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
    high: { label: 'High', class: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    medium: { label: 'Medium', class: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    low: { label: 'Low', class: 'bg-white/10 text-white/50 border-white/10' },
  };

  return (
    <div className="space-y-6">
      {/* Inline Fast Task Creator */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.12] p-4 backdrop-blur-xl shadow-glass-sm">
        <form onSubmit={handleCreateTask}>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Add a new task (press Enter to save)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder:text-white/40 text-sm focus:outline-none"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-2 rounded-xl transition-colors text-xs flex items-center gap-1.5 ${
                  showAdvanced || dueDate
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
                title="Task details"
              >
                <Calendar className="w-4 h-4" />
                {dueDate && <span className="hidden sm:inline text-[11px]">{dueDate}</span>}
              </button>

              <GlassButton
                variant="primary"
                size="sm"
                type="submit"
                disabled={!newTitle.trim()}
                icon={<Plus className="w-4 h-4" />}
              >
                Add
              </GlassButton>
            </div>
          </div>

          {/* Advanced Options Drawer */}
          {showAdvanced && (
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="text-white/60">Priority:</span>
                {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1 rounded-lg border capitalize transition-all ${
                      priority === p
                        ? priorityColors[p].class
                        : 'border-white/10 text-white/40 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/60">Due date:</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-white/[0.06] border border-white/10 rounded-lg px-2.5 py-1 text-white text-xs outline-none"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Task Filters & Counts Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/10">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                soundService.playTap();
                setFilter(tab);
              }}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-all capitalize ${
                filter === tab
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-white/40 font-mono">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Task Items List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-dashed border-white/10">
          <Sparkles className="w-8 h-8 text-white/30 mx-auto mb-2" />
          <p className="text-sm text-white/60">
            {filter === 'completed'
              ? 'No completed tasks in this block yet.'
              : filter === 'active'
              ? 'No active tasks remaining. Great job!'
              : 'No tasks added to this block yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task) => {
            const isEditing = editingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`group relative rounded-2xl border transition-all duration-200 p-3.5 flex items-start gap-3.5 ${
                  task.completed
                    ? 'bg-white/[0.02] border-white/[0.06] opacity-65'
                    : 'bg-white/[0.05] hover:bg-white/[0.08] border-white/[0.12] hover:border-white/25 shadow-glass-sm'
                }`}
              >
                {/* Checkbox Morph Button */}
                <button
                  type="button"
                  onClick={() => handleToggle(task)}
                  className={`relative mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                    task.completed
                      ? 'bg-sky-500 border-sky-400 text-black shadow-[0_0_12px_rgba(56,189,248,0.5)]'
                      : 'border-white/30 hover:border-white hover:bg-white/10 text-transparent'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${task.completed ? 'scale-100' : 'scale-0'}`} />
                </button>

                {/* Content / Editor */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-sm text-white outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateTask({ ...task, title: editingTitle.trim() });
                            setEditingTaskId(null);
                          } else if (e.key === 'Escape') {
                            setEditingTaskId(null);
                          }
                        }}
                      />
                      <GlassButton
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          onUpdateTask({ ...task, title: editingTitle.trim() });
                          setEditingTaskId(null);
                        }}
                      >
                        Save
                      </GlassButton>
                    </div>
                  ) : (
                    <div>
                      <span
                        onClick={() => handleToggle(task)}
                        className={`text-sm cursor-pointer select-none transition-all ${
                          task.completed
                            ? 'line-through text-white/40'
                            : 'text-white/90 hover:text-white font-medium'
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.description && (
                        <p className="mt-1 text-xs text-white/50 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Metadata Badges */}
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {task.priority && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                              priorityColors[task.priority].class
                            }`}
                          >
                            {priorityColors[task.priority].label}
                          </span>
                        )}

                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[11px] text-white/50 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/10">
                            <Clock className="w-3 h-3 text-sky-400" />
                            {task.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Task Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setEditingTitle(task.title);
                    }}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    title="Edit task"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      soundService.playDismiss();
                      hapticsService.light();
                      onDeleteTask(task.id);
                    }}
                    className="p-1.5 rounded-lg text-rose-400/60 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
