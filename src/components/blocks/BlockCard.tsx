import React, { useState } from 'react';
import { Block, Task, Attachment } from '../../types';
import { CircularProgress } from '../ui/CircularProgress';
import { LinearProgress } from '../ui/LinearProgress';
import {
  ACCENT_CONFIG,
  ICON_MAP,
  formatRelativeTime,
} from '../../utils/formatters';
import { MoreHorizontal, Edit3, Trash2, ArrowUpRight, Paperclip, CheckCircle2 } from 'lucide-react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

interface BlockCardProps {
  block: Block;
  tasks: Task[];
  attachments: Attachment[];
  onOpen: (block: Block) => void;
  onEdit: (block: Block) => void;
  onDelete: (blockId: string) => void;
}

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  tasks,
  attachments,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const accent = ACCENT_CONFIG[block.accent] || ACCENT_CONFIG.ice;
  const IconComponent = ICON_MAP[block.icon] || ICON_MAP.Layers;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleCardClick = (e: React.MouseEvent) => {
    // Avoid triggering when menu clicked
    if ((e.target as HTMLElement).closest('.menu-trigger, .menu-dropdown')) {
      return;
    }
    soundService.playEnterBlock();
    hapticsService.medium();
    onOpen(block);
  };

  return (
    <div
      onClick={handleCardClick}
      className="liquid-glass group relative rounded-3xl p-6 cursor-pointer overflow-hidden flex flex-col justify-between"
    >
      {/* Top Specular Reflection Highlight */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

      {/* Atmospheric Accent Ambient Glow */}
      <div
        className="absolute -top-20 -right-20 w-44 h-44 rounded-full pointer-events-none blur-3xl opacity-25 group-hover:opacity-40 transition-opacity duration-500"
        style={{ background: accent.primary }}
      />

      {/* Card Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Spatial Icon Container */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105"
            style={{
              background: accent.bgSubtle,
              borderColor: accent.border,
              boxShadow: `0 0 20px -4px ${accent.glow}`,
            }}
          >
            <IconComponent className="w-6 h-6" style={{ color: accent.primary }} />
          </div>

          {/* Quick Actions & Menu */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                soundService.playTap();
                setMenuOpen(!menuOpen);
              }}
              className="menu-trigger p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                />
                <div className="menu-dropdown absolute right-4 top-14 z-30 w-36 rounded-2xl bg-slate-900/90 border border-white/20 p-1.5 shadow-2xl backdrop-blur-2xl animate-fade-in">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onEdit(block);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Edit Block</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onDelete(block.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-300 hover:text-rose-100 hover:bg-rose-500/20 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Title and Description */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold tracking-tight text-white group-hover:text-white transition-colors">
              {block.name}
            </h3>
            <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          <p className="mt-1.5 text-xs text-white/60 line-clamp-2 leading-relaxed">
            {block.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Card Stats and Progress Section */}
      <div className="mt-6 pt-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-white/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-white/50" />
              <span>
                {completedTasks} / {totalTasks} Tasks
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-white/40">
              <span>{formatRelativeTime(block.updatedAt)}</span>
              {attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {attachments.length} {attachments.length === 1 ? 'file' : 'files'}
                </span>
              )}
            </div>
          </div>

          {/* Mini Circular Progress */}
          <CircularProgress
            percentage={progress}
            size={48}
            strokeWidth={4.5}
            accent={block.accent}
          />
        </div>

        {/* Linear Progress Bar for Depth */}
        <LinearProgress percentage={progress} height={4} accent={block.accent} />
      </div>
    </div>
  );
};
