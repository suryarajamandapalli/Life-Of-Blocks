import React from 'react';
import { Block, Task, Attachment } from '../../types';
import { BlockCard } from './BlockCard';
import { Plus, Sparkles, Layers } from 'lucide-react';
import { GlassButton } from '../ui/GlassButton';

interface BlockListProps {
  blocks: Block[];
  tasks: Task[];
  attachments: Attachment[];
  onOpenBlock: (block: Block) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (blockId: string) => void;
  onCreateBlock: () => void;
}

export const BlockList: React.FC<BlockListProps> = ({
  blocks,
  tasks,
  attachments,
  onOpenBlock,
  onEditBlock,
  onDeleteBlock,
  onCreateBlock,
}) => {
  // Empty State
  if (blocks.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="relative w-24 h-24 rounded-3xl bg-white/[0.04] border border-white/15 flex items-center justify-center shadow-glass-lg backdrop-blur-2xl mb-6">
          <Layers className="w-10 h-10 text-sky-400/80 animate-pulse-slow" />
          <div className="absolute inset-0 rounded-3xl bg-sky-400/10 blur-xl" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-white mb-2">
          Nothing here yet.
        </h2>
        <p className="text-base text-white/50 max-w-md leading-relaxed mb-8">
          Start by creating a Block for something that matters. Your life, organized in focused
          spatial rooms.
        </p>

        <GlassButton
          variant="primary"
          size="lg"
          icon={<Plus className="w-5 h-5" />}
          onClick={onCreateBlock}
          glow
        >
          Create First Block
        </GlassButton>
      </div>
    );
  }

  // Calculate global summary
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const globalProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Hero Header */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/10 text-xs text-sky-300 font-medium mb-3 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Spatial Life OS</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white">
            YOUR LIFE.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300">
              IN BLOCKS.
            </span>
          </h1>

          <p className="mt-3 text-sm sm:text-base text-white/60 max-w-xl font-light leading-relaxed">
            Organize the things that matter into focused visual spaces. Enter a block, work on what
            matters, and keep your tasks and resources together.
          </p>
        </div>

        {/* Global Progress Pill */}
        <div className="liquid-glass-pill flex-shrink-0 self-start sm:self-auto px-5 py-3 flex items-center gap-4">
          <div>
            <div className="text-[11px] text-white/50 font-medium uppercase tracking-wider">
              Life Velocity
            </div>
            <div className="text-lg font-bold text-white mt-0.5">
              {completedTasks} / {totalTasks} <span className="text-xs font-normal text-white/50">Done</span>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <div className="text-2xl font-bold text-sky-400">{globalProgress}%</div>
            <div className="text-[10px] text-white/40">Overall</div>
          </div>
        </div>
      </div>

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blocks.map((block) => {
          const blockTasks = tasks.filter((t) => t.blockId === block.id);
          const blockAttachments = attachments.filter((a) => a.blockId === block.id);

          return (
            <BlockCard
              key={block.id}
              block={block}
              tasks={blockTasks}
              attachments={blockAttachments}
              onOpen={onOpenBlock}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
            />
          );
        })}

        {/* Quick Add Spatial Card */}
        <button
          onClick={onCreateBlock}
          className="group rounded-3xl border border-dashed border-white/15 hover:border-sky-400/50 bg-white/[0.02] hover:bg-sky-500/[0.04] p-8 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[220px] cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/[0.05] group-hover:bg-sky-500/20 border border-white/10 group-hover:border-sky-400/40 flex items-center justify-center text-white/60 group-hover:text-sky-300 transition-all duration-300 mb-4 group-hover:scale-110 shadow-glass-sm">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-base font-semibold text-white/90 group-hover:text-white transition-colors">
            Create New Block
          </span>
          <span className="text-xs text-white/40 mt-1 max-w-[200px]">
            Add a new area of your life to manage and track
          </span>
        </button>
      </div>
    </div>
  );
};
