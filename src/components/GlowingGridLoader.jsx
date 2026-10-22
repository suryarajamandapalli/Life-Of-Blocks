import React from 'react';

export default function GlowingGridLoader({ isVisible }) {
  // 12 glass blocks (3x4 on mobile, 4x3 on tablet/desktop)
  const blocks = Array.from({ length: 12 });

  return (
    <div
      className={`fixed inset-0 z-[1] pointer-events-none flex flex-col items-center justify-center p-5 sm:p-10 transition-opacity duration-600 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden={!isVisible}
    >
      {/* Ambient background refraction */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity duration-500" />

      {/* Floating Responsive Glass Blocks Grid */}
      <div className="relative w-full max-w-4xl h-[70vh] max-h-[560px] grid grid-cols-3 sm:grid-cols-4 grid-rows-4 sm:grid-rows-3 gap-3.5 sm:gap-5 z-10">
        {blocks.map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          const delayMs = (row + col) * 140;

          return (
            <div
              key={i}
              className="relative w-full h-full rounded-2xl sm:rounded-3xl border border-white/20 bg-white/[0.04] backdrop-blur-[8px] animate-grid-block transition-all"
              style={{
                animationDelay: `${delayMs}ms`,
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)'
              }}
            >
              {/* Subtle specular rim light inside each block */}
              <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Floating Pill Label */}
      <div className="relative z-10 mt-6 sm:mt-8 px-4 py-2 rounded-full bg-black/65 border border-white/20 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        <span className="text-xs font-medium tracking-wider text-white/90">
          Shuffling 4K Atmosphere...
        </span>
      </div>
    </div>
  );
}
