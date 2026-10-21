import React from 'react';
import { Block, Task, Attachment, Note, AccentColor } from '../../types';
import { ACCENT_CONFIG, formatFileSize } from '../../utils/formatters';
import {
  CheckCircle2,
  Clock,
  Paperclip,
  BookOpen,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';
import { CircularProgress } from '../ui/CircularProgress';

interface OverviewSectionProps {
  block: Block;
  tasks: Task[];
  attachments: Attachment[];
  notes: Note[];
  accent: AccentColor;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  block,
  tasks,
  attachments,
  notes,
  accent,
}) => {
  const accentDetails = ACCENT_CONFIG[accent];

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && !t.completed).length;
  const highTasks = tasks.filter((t) => t.priority === 'high' && !t.completed).length;

  const totalAttachmentBytes = attachments.reduce((acc, curr) => acc + curr.size, 0);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Completion Velocity */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.1] p-5 backdrop-blur-xl shadow-glass-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 font-medium">Completion Rate</div>
            <div className="text-2xl font-bold text-white mt-1">{progress}%</div>
            <div className="text-[11px] text-white/40 mt-1">
              {completedTasks} of {totalTasks} tasks done
            </div>
          </div>
          <CircularProgress percentage={progress} size={48} strokeWidth={4.5} accent={accent} />
        </div>

        {/* Pending Items */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.1] p-5 backdrop-blur-xl shadow-glass-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 font-medium">Pending Tasks</div>
            <div className="text-2xl font-bold text-sky-400 mt-1">{pendingTasks}</div>
            <div className="text-[11px] text-white/40 mt-1">
              {urgentTasks > 0 ? `${urgentTasks} urgent priorities` : 'On track'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Workspace Files */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.1] p-5 backdrop-blur-xl shadow-glass-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 font-medium">Resources & Files</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{attachments.length}</div>
            <div className="text-[11px] text-white/40 mt-1">{formatFileSize(totalAttachmentBytes)} stored</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Paperclip className="w-5 h-5" />
          </div>
        </div>

        {/* Knowledge Notes */}
        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.1] p-5 backdrop-blur-xl shadow-glass-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-white/50 font-medium">Notes & Briefs</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{notes.length}</div>
            <div className="text-[11px] text-white/40 mt-1">Written insights</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Focus & Momentum Card */}
      <div className="rounded-3xl bg-white/[0.04] border border-white/[0.12] p-6 backdrop-blur-2xl shadow-glass-md relative overflow-hidden">
        {/* Top Specular Inner Rim */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border flex-shrink-0"
            style={{
              background: accentDetails.bgSubtle,
              borderColor: accentDetails.border,
            }}
          >
            <TrendingUp className="w-6 h-6" style={{ color: accentDetails.primary }} />
          </div>

          <div>
            <h3 className="text-base font-semibold text-white">Spatial Workspace Philosophy</h3>
            <p className="mt-1.5 text-xs text-white/60 leading-relaxed max-w-2xl">
              "When you enter the <strong className="text-white font-medium">{block.name}</strong>{' '}
              block, you enter a distraction-free digital room. All tasks, files, notes, and progress
              for this life area are isolated here so you can do deep, meaningful work without context switching."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
