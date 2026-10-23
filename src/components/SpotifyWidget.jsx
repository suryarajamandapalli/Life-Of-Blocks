import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Minimize2, 
  X, 
  Volume2, 
  VolumeX, 
  Music2 
} from 'lucide-react';
import { lofiAudio, LOFI_PLAYLIST, formatTime } from '../services/lofiAudio';

export default function SpotifyWidget({ isVisible, onClose }) {
  const [audioState, setAudioState] = useState(() => lofiAudio.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedTab, setExpandedTab] = useState('lofi'); // 'lofi' | 'spotify'
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const unsub = lofiAudio.subscribe((state) => {
      setAudioState(state);
    });
    return () => unsub();
  }, []);

  if (!isVisible) return null;

  const currentTrack = audioState.currentTrack;
  const isPlaying = audioState.isPlaying;
  const progressPercent = audioState.progressPercent;

  const handleTogglePlay = (e) => {
    e?.stopPropagation();
    lofiAudio.togglePlay();
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    lofiAudio.prev();
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    lofiAudio.next();
  };

  const handleSeek = (e) => {
    e?.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    lofiAudio.seek(ratio * currentTrack.duration);
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      lofiAudio.setVolume(0.75);
      setIsMuted(false);
    } else {
      lofiAudio.setVolume(0);
      setIsMuted(true);
    }
  };

  return (
    <>
      {/* ========================================================
          01 — FLOATING MINI-PLAYER (Compact Pill/Card)
          Desktop: Anchored bottom-right, max ~320px wide
          Mobile: Compact bottom floating player, zero horizontal overflow
          ======================================================== */}
      <div 
        className="relative select-none transition-all duration-300 w-full max-w-[min(320px,calc(100vw-32px))] sm:w-[320px] flex-shrink-0 animate-fade-in"
      >
        <div 
          className="relative group rounded-2xl overflow-hidden border border-white/15 backdrop-blur-2xl bg-black/70 p-2.5 shadow-2xl transition-all duration-300 hover:border-white/25 hover:bg-black/80"
          style={{
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.75), 0 8px 16px -4px rgba(0, 0, 0, 0.45)'
          }}
        >
          {/* Top Row: Artwork + Song Title & Artist + Controls */}
          <div className="flex items-center gap-2.5">
            {/* 1. Album Artwork */}
            <div 
              onClick={() => setIsExpanded(true)}
              className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-md cursor-pointer group-hover:scale-102 transition-transform"
            >
              <img 
                src={currentTrack.artwork} 
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isPlaying ? 'scale-105' : 'scale-100 opacity-80'
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              )}
            </div>

            {/* 2. Song Title & Artist */}
            <div 
              onClick={() => setIsExpanded(true)}
              className="flex-1 min-w-0 pr-1 cursor-pointer"
            >
              <p className="text-[12px] sm:text-[12.5px] font-semibold text-white truncate leading-tight drop-shadow-sm">
                {currentTrack.title}
              </p>
              <p className="text-[10.5px] sm:text-[11px] text-white/50 truncate leading-tight mt-0.5">
                {currentTrack.artist}
              </p>
            </div>

            {/* 3. Controls: Previous, Play/Pause, Next */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handlePrev}
                title="Previous Track"
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? "Pause" : "Play"}
                className="w-7 h-7 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                title="Next Track"
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>

              {/* 4. Small Expand Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Expand Player"
                className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <Maximize2 className="w-3 h-3" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                title="Close (S)"
                className="p-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Bottom: Progress Bar */}
          <div 
            onClick={handleSeek}
            className="mt-2 w-full h-1 sm:h-1.5 bg-white/10 hover:bg-white/15 rounded-full overflow-hidden cursor-pointer relative transition-all"
          >
            <div 
              className="h-full bg-emerald-400 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          02 — EXPANDED PLAYER: Clean Centered Modal/Sheet
          Opens in the center of the viewport, NOT a giant sidebar.
          ======================================================== */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in select-none">
          {/* Backdrop Click Closes Modal */}
          <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />

          <div 
            className="relative w-full max-w-[400px] rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/15 p-5 sm:p-6 shadow-2xl z-10 animate-modal-in overflow-hidden max-h-[90vh] flex flex-col"
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Top Modal Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
                  Now Playing
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  title="Minimize to Pill"
                  className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    onClose?.();
                  }}
                  title="Close (S)"
                  className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Switcher: Life of Blocks Lo-Fi vs Spotify Embed */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-4 text-xs font-medium flex-shrink-0">
              <button
                type="button"
                onClick={() => setExpandedTab('lofi')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                  expandedTab === 'lofi'
                    ? 'bg-white/15 text-white shadow-sm font-semibold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Life of Blocks Lo-Fi
              </button>
              <button
                type="button"
                onClick={() => setExpandedTab('spotify')}
                className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
                  expandedTab === 'spotify'
                    ? 'bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 shadow-sm font-semibold'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Spotify Embed
              </button>
            </div>

            {/* TAB 1: Native Life of Blocks Lo-Fi Player */}
            {expandedTab === 'lofi' ? (
              <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
                {/* Large Centered Album Artwork */}
                <div className="w-44 h-44 sm:w-48 sm:h-48 mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/15 mb-4 relative flex-shrink-0">
                  <img 
                    src={currentTrack.artwork} 
                    alt={currentTrack.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isPlaying ? 'scale-105' : 'scale-100'
                    }`}
                  />
                </div>

                {/* Song Title & Artist */}
                <div className="text-center mb-4 flex-shrink-0">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate drop-shadow-sm">
                    {currentTrack.title}
                  </h3>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {currentTrack.artist} • <span className="text-emerald-400/80">{currentTrack.mood}</span>
                  </p>
                </div>

                {/* Progress Bar with Time Labels */}
                <div className="mb-4 flex-shrink-0">
                  <div 
                    onClick={handleSeek}
                    className="w-full h-1.5 bg-white/10 hover:bg-white/15 rounded-full overflow-hidden cursor-pointer relative transition-all"
                  >
                    <div 
                      className="h-full bg-emerald-400 rounded-full transition-all duration-150"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40 mt-1.5">
                    <span>{formatTime(audioState.currentTime)}</span>
                    <span>{formatTime(currentTrack.duration)}</span>
                  </div>
                </div>

                {/* Playback Controls & Volume */}
                <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleVolumeToggle}
                    title={isMuted ? "Unmute" : "Mute"}
                    className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrev}
                      title="Previous Track"
                      className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
                    >
                      <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleTogglePlay}
                      title={isPlaying ? "Pause" : "Play"}
                      className="w-12 h-12 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      title="Next Track"
                      className="p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
                    >
                      <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <a
                    href={currentTrack.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open on Spotify"
                    className="p-2 rounded-full text-white/60 hover:text-[#1DB954] hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <Music2 className="w-4 h-4" />
                  </a>
                </div>

                {/* Track Selection List */}
                <div className="max-h-28 overflow-y-auto no-scrollbar border-t border-white/10 pt-2 flex flex-col gap-1">
                  {LOFI_PLAYLIST.map((track, idx) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => lofiAudio.selectTrack(idx)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                        audioState.currentTrackIndex === idx
                          ? 'bg-white/10 text-white font-medium'
                          : 'text-white/50 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className={`text-[11px] font-mono w-4 text-center ${
                          audioState.currentTrackIndex === idx ? 'text-emerald-400 font-bold' : 'opacity-40'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-xs truncate">{track.title}</p>
                          <p className="text-[10px] opacity-50 truncate">{track.artist}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono opacity-40 flex-shrink-0">
                        {formatTime(track.duration)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* TAB 2: Clean Spotify Embed (Centered inside modal!) */
              <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/60 shadow-xl flex-shrink-0">
                <iframe
                  data-testid="embed-iframe"
                  style={{ borderRadius: '14px', display: 'block' }}
                  src="https://open.spotify.com/embed/playlist/5LaauJZw8vn2gPWHxDFYc2?utm_source=generator&theme=0"
                  width="100%"
                  height="320"
                  frameBorder="0"
                  allowFullScreen=""
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="w-full block"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
