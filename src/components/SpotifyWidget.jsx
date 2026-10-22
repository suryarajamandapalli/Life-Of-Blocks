import React from 'react';
import { X, Music2 } from 'lucide-react';

export default function SpotifyWidget({ isVisible, onClose }) {
  if (!isVisible) return null;

  return (
    <div
      className="relative select-none animate-modal-in transition-all duration-300 w-[276px] sm:w-[290px] flex-shrink-0"
      style={{ perspective: '1000px' }}
    >
      {/* ========================================================
          SPOTIFY PLAYER CHASSIS
          Matches the width and matte hardware style of the Pomodoro
          ======================================================== */}
      <div
        className="relative rounded-[26px] p-3 sm:p-3.5 select-none overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1e2126 0%, #15171b 100%)',
          boxShadow: `
            0 24px 50px -10px rgba(0, 0, 0, 0.85),
            0 10px 20px -5px rgba(0, 0, 0, 0.5),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.25),
            inset 0 -2px 3px 0 rgba(0, 0, 0, 0.5)
          `,
          border: '1px solid rgba(255, 255, 255, 0.18)'
        }}
      >
        {/* Subtle Top Header Bar */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-1">
          <div className="flex items-center gap-2">
            {/* Spotify Green Accent Icon */}
            <div className="w-5 h-5 rounded-full bg-[#1DB954]/20 border border-[#1DB954]/50 flex items-center justify-center text-[#1DB954] shadow-sm">
              <Music2 className="w-3 h-3 stroke-[2.4]" />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-white/90 uppercase drop-shadow-sm flex items-center gap-1.5">
              <span>SPOTIFY</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-white/10 text-white/60 border border-white/10">
              S
            </kbd>
            <button
              onClick={onClose}
              title="Close Spotify Player (Press S to toggle)"
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center cursor-pointer transition-all active:scale-95"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* ========================================================
            SPOTIFY EMBED IFRAME
            Smoothly adapts to height responsive container
            ======================================================== */}
        <div className="w-full rounded-[14px] overflow-hidden bg-black/60 shadow-inner border border-white/10">
          <iframe
            data-testid="embed-iframe"
            style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/playlist/5LaauJZw8vn2gPWHxDFYc2?utm_source=generator&si=be3867ff0a1d44c0"
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen=""
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="w-full block"
          />
        </div>
      </div>
    </div>
  );
}
