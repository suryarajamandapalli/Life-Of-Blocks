import React from 'react';
import { Block, Task } from '../../types';
import { CircularProgress } from '../ui/CircularProgress';
import { ACCENT_CONFIG, ICON_MAP } from '../../utils/formatters';
import { ArrowLeft, Edit3, Plus, Paperclip } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface WorkspaceHeaderProps {
  block: Block;
  tasks: Task[];
  onBack: () => void;
  onEditBlock: () => void;
  onQuickAddTask: () => void;
  onQuickAddAttachment: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  block,
  tasks,
  onBack,
  onEditBlock,
  onQuickAddTask,
  onQuickAddAttachment,
}) => {
  const accent = ACCENT_CONFIG[block.accent] || ACCENT_CONFIG.ice;
  const IconComponent = ICON_MAP[block.icon] || ICON_MAP.Layers;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="liquid-glass relative rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden">
      {/* Top Specular Inner Rim */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Atmospheric Accent Ambient Glow */}
      <div
        className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none blur-3xl opacity-30"
        style={{ background: accent.primary }}
      />

      {/* Navigation Top Row */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            soundService.playDismiss();
            hapticsService.light();
            onBack();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white/70 hover:text-white transition-all text-xs font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blocks</span>
        </button>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="glass"
            size="sm"
            icon={<Edit3 className="w-3.5 h-3.5" />}
            onClick={onEditBlock}
          >
            <span className="hidden sm:inline">Customize</span>
          </GlassButton>
        </div>
      </div>

      {/* Block Main Info & Progress Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* Spatial Icon Tile */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center border flex-shrink-0 shadow-lg"
            style={{
              background: accent.bgSubtle,
              borderColor: accent.border,
              boxShadow: `0 0 25px -5px ${accent.glow}`,
            }}
          >
            <IconComponent className="w-8 h-8" style={{ color: accent.primary }} />
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {block.name}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                style={{
                  background: accent.bgSubtle,
                  borderColor: accent.border,
                  color: accent.light,
                }}
              >
                {accent.name}
              </span>
            </div>

            <p className="mt-2 text-sm text-white/70 max-w-2xl leading-relaxed">
              {block.description || 'Welcome to your focused workspace for this area of life.'}
            </p>
          </div>
        </div>

        {/* Circular Progress & Quick Actions */}
        <div className="flex items-center gap-6 self-start md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-white/10 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-2xl font-bold text-white tracking-tight">
              {completed} / {total}
            </div>
            <div className="text-xs text-white/50">Tasks Completed</div>
          </div>

          <CircularProgress
            percentage={progress}
            size={72}
            strokeWidth={6}
            accent={block.accent}
          />
        </div>
      </div>

      {/* Quick Action Ribbon */}
      <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center gap-3 flex-wrap">
        <GlassButton
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={onQuickAddTask}
        >
          Add Task
        </GlassButton>

        <GlassButton
          variant="secondary"
          size="sm"
          icon={<Paperclip className="w-3.5 h-3.5" />}
          onClick={onQuickAddAttachment}
        >
          Attach File
        </GlassButton>
      </div>
    </div>
  );
};
