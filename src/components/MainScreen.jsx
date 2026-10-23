import React, { useRef } from 'react';
import { Trash2, Box } from 'lucide-react';
import { useAdaptiveContrast } from '../hooks/useAdaptiveContrast';

export default function MainScreen({
  blocks = [],
  todos = [],
  loading = false,
  wallpaper,
  onOpenBlock,
  onOpenCreateModal,
  onRequestDeleteBlock
}) {
  const containerRef = useRef(null);
  const contrast = useAdaptiveContrast(containerRef, wallpaper);
  const isLight = contrast.isLight;

  // Only display root blocks on the main dashboard (sub-blocks live inside their parent blocks)
  const rootBlocks = blocks.filter((b) => !b.parentBlockId);

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[760px] mx-auto px-4 sm:px-6 min-h-[85vh] flex flex-col items-center justify-center animate-page-in select-none transition-colors duration-300"
    >
      {/* Title with simple inline '+' trigger */}
      <h1 
        className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.18em] text-center transition-colors duration-300 ${
          isLight
            ? 'text-zinc-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.85)]'
            : 'text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]'
        }`}
      >
        <span>LIFE OF BLOCKS</span>{' '}
        <button
          type="button"
          onClick={onOpenCreateModal}
          title="Create Block (+ or N)"
          aria-label="Create Block"
          className="cursor-pointer hover:opacity-70 hover:scale-110 active:scale-90 transition-all inline-block select-none font-bold px-1.5 py-0.5 -mx-1"
        >
          +
        </button>
      </h1>

      {/* When blocks exist: display the user's blocks */}
      {!loading && rootBlocks.length > 0 && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 mt-8 sm:mt-12 mb-6 sm:mb-8">
          {rootBlocks.map((block) => {
            const blockTodos = todos.filter(t => t.blockId === block.id);
            const total = blockTodos.length;
            const completed = blockTodos.filter(t => t.completed).length;
            const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

            // Nested sub-blocks inside this block
            const subBlocksCount = blocks.filter(b => b.parentBlockId === block.id).length;

            const isAllDone = total > 0 && completed === total;
            const isPartDone = total > 0 && completed > 0 && completed < total;
            const isNothingDone = total > 0 && completed === 0;

            const barColor = isAllDone
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
              : isPartDone
                ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : isNothingDone
                  ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                  : (isLight ? 'bg-black/20' : 'bg-white/20');

            const textColor = isAllDone
              ? 'text-emerald-400 font-semibold'
              : isPartDone
                ? 'text-amber-300 font-medium'
                : isNothingDone
                  ? 'text-rose-400 font-medium'
                  : (isLight ? 'text-zinc-600' : 'text-white/40');

            return (
              <div
                key={block.id}
                onClick={() => onOpenBlock(block)}
                className={`group relative p-4 sm:p-5 rounded-2xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all duration-200 ${
                  isLight
                    ? 'bg-white/50 backdrop-blur-xl border border-black/10 hover:border-black/25 shadow-lg'
                    : 'smoked-tile'
                }`}
              >
                {/* Block Info */}
                <div className="min-w-0 flex-1 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 
                      className={`text-base sm:text-lg font-semibold tracking-wide truncate transition-colors ${
                        isLight ? 'text-zinc-950' : 'text-white'
                      }`}
                    >
                      {block.name}
                    </h3>
                    {subBlocksCount > 0 && (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${
                        isLight
                          ? 'bg-amber-500/15 text-amber-800 border-amber-500/30'
                          : 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                      }`}>
                        <Box className="w-2.5 h-2.5" />
                        <span>{subBlocksCount}</span>
                      </span>
                    )}
                  </div>

                  {/* Progress bar with color code and #/# at the end */}
                  <div className="flex items-center gap-2.5 mt-2">
                    <div className={`flex-1 h-1.5 sm:h-2 rounded-full overflow-hidden ${
                      isLight ? 'bg-black/10' : 'bg-white/10'
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                        style={{
                          width: `${
                            total === 0 
                              ? 0 
                              : isNothingDone 
                                ? 6 
                                : percent
                          }%`
                        }}
                      />
                    </div>
                    <span className={`text-[11.5px] sm:text-xs font-mono tracking-wider flex-shrink-0 ${textColor}`}>
                      {completed} / {total}
                    </span>
                  </div>
                </div>

                {/* Delete Trigger */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDeleteBlock(block);
                  }}
                  title="Delete Block"
                  className={`p-2 rounded-xl sm:opacity-0 sm:group-hover:opacity-100 hover:text-rose-500 transition-all cursor-pointer flex-shrink-0 active:scale-90 ${
                    isLight 
                      ? 'text-zinc-700/60 hover:bg-black/5' 
                      : 'text-white/40 hover:text-rose-400 hover:bg-white/5'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}