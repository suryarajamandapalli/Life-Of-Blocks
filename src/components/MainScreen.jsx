import React, { useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useAdaptiveContrast } from '../hooks/useAdaptiveContrast';

export default function MainScreen({
  blocks,
  todos,
  loading,
  wallpaper,
  onOpenBlock,
  onOpenCreateModal,
  onRequestDeleteBlock
}) {
  const containerRef = useRef(null);
  const contrast = useAdaptiveContrast(containerRef, wallpaper);
  const isLight = contrast.isLight;

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[760px] mx-auto px-4 sm:px-6 min-h-[85vh] flex flex-col items-center justify-center animate-page-in select-none transition-colors duration-300"
    >
      {/* Title */}
      <h1 
        className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.18em] text-center transition-colors duration-300 ${
          isLight
            ? 'text-zinc-950 drop-shadow-[0_1px_8px_rgba(255,255,255,0.85)]'
            : 'text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]'
        }`}
      >
        LIFE OF BLOCKS
      </h1>

      {/* When blocks exist: display the user's blocks */}
      {!loading && blocks.length > 0 && (
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 my-10 sm:my-14">
          {blocks.map((block) => {
            const blockTodos = todos.filter(t => t.blockId === block.id);
            const total = blockTodos.length;
            const completed = blockTodos.filter(t => t.completed).length;

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
                  <h3 
                    className={`text-base sm:text-lg font-semibold tracking-wide truncate mb-1 transition-colors ${
                      isLight ? 'text-zinc-950' : 'text-white'
                    }`}
                  >
                    {block.name}
                  </h3>
                  <p 
                    className={`text-xs sm:text-sm font-normal tracking-wider transition-colors ${
                      isLight ? 'text-zinc-800/70' : 'text-white/50'
                    }`}
                  >
                    {completed} / {total} completed
                  </p>
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

      {/* Single + Button */}
      <div className={`${blocks.length > 0 ? 'mt-2 mb-8' : 'mt-14 sm:mt-20'}`}>
        <button
          onClick={onOpenCreateModal}
          title="Create Block (+)"
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-2xl cursor-pointer group ${
            isLight
              ? 'bg-white/70 hover:bg-white/90 border border-black/15 text-zinc-900 hover:border-black/30'
              : 'smoked-tile text-white/85 hover:text-white hover:border-white/30'
          }`}
        >
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2] group-hover:rotate-90 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
}