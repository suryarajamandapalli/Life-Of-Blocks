import React, { useState } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';

export default function SpotifyWidget({ isVisible, onClose }) {
  // Compact by default (152px) for sleek responsiveness; expandable to 352px for full playlist
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div
      className="relative select-none animate-modal-in transition-all duration-300 w-full max-w-[280px] sm:w-[285px] flex-shrink-0"
    >
      {/* ========================================================
          ULTRA-MINIMAL SPOTIFY PLAYER FRAME
          Zero bulky double-casings, zero nested boxes.
          Pure native Spotify embed with subtle glass border & controls.
          ======================================================== */}
      <div 
        className="relative group rounded-[16px] overflow-hidden shadow-2xl border border-white/20 backdrop-blur-xl bg-black/60 transition-all duration-300"
        style={{
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.75), 0 8px 16px -4px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Floating Controls Overlay (Expand / Compact & Close) */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
          {/* Toggle Compact (152px) vs Full Playlist (352px) */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Switch to Compact Player (152px)' : 'Switch to Full Playlist (352px)'}
            className="w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white/70 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90"
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3 stroke-[2.2]" />
            ) : (
              <Maximize2 className="w-3 h-3 stroke-[2.2]" />
            )}
          </button>

          {/* Close Player */}
          <button
            type="button"
            onClick={onClose}
            title="Close Spotify Player (Press S to toggle)"
            className="w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white/70 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer transition-all shadow-md active:scale-90"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Clean Spotify Iframe Embed */}
        <iframe
          data-testid="embed-iframe"
          style={{ borderRadius: '14px', display: 'block' }}
          src="https://open.spotify.com/embed/playlist/5LaauJZw8vn2gPWHxDFYc2?utm_source=generator&si=be3867ff0a1d44c0"
          width="100%"
          height={isExpanded ? "352" : "152"}
          frameBorder="0"
          allowFullScreen=""
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="w-full block transition-all duration-300"
        />
      </div>
    </div>
  );
}
