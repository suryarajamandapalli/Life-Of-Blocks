import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Volume1, 
  Volume2, 
  VolumeX, 
  ListMusic
} from 'lucide-react';
import { lofiAudio, LOFI_PLAYLIST, formatTime } from '../services/lofiAudio';

export default function SpotifyWidget({ isVisible, onClose }) {
  const [audioState, setAudioState] = useState(() => lofiAudio.getState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(0.75);
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

  const handleVolumeToggle = (e) => {
    e?.stopPropagation();
    if (isMuted) {
      lofiAudio.setVolume(volume || 0.75);
      setIsMuted(false);
    } else {
      lofiAudio.setVolume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e) => {
    e?.stopPropagation();
    const val = parseFloat(e.target.value);
    setVolume(val);
    lofiAudio.setVolume(val);
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Close on Escape when expanded
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isExpanded]);

  return (
    <>
      {/* ========================================================
          01 — COMPACT FLOATING MINI-PLAYER (Apple Music Pill)
          Desktop: Anchored bottom-right, ~320px wide
          Mobile: Clean bottom floating bar, zero overflow
          ======================================================== */}
      <div 
        className="relative select-none w-full max-w-[min(320px,calc(100vw-32px))] sm:w-[320px] flex-shrink-0 animate-fade-in"
      >
        <div 
          className="relative group rounded-2xl overflow-hidden border border-white/15 backdrop-blur-2xl bg-zinc-950/80 p-2.5 shadow-2xl transition-all duration-300 hover:border-white/25 hover:bg-zinc-950/90"
          style={{
            boxShadow: '0 16px 36px -8px rgba(0, 0, 0, 0.75), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}
        >
          {/* Main Pill Content: Artwork + Song Info + Transport Buttons */}
          <div className="flex items-center gap-2.5">
            {/* 1. Album Artwork */}
            <div 
              onClick={() => setIsExpanded(true)}
              className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 shadow-md cursor-pointer group-hover:scale-102 transition-transform"
            >
              <img 
                src={currentTrack.artwork} 
                alt={currentTrack.title}
                className={`w-full h-full object-cover transition-transform duration-500 ${
                  isPlaying ? 'scale-105' : 'scale-100 opacity-80'
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] animate-pulse" />
                </div>
              )}
            </div>

            {/* 2. Song Title & Artist */}
            <div 
              onClick={() => setIsExpanded(true)}
              className="flex-1 min-w-0 pr-1 cursor-pointer"
            >
              <p className="text-[12px] font-semibold text-white tracking-tight truncate leading-tight drop-shadow-sm">
                {currentTrack.title}
              </p>
              <p className="text-[10px] text-white/50 truncate leading-tight mt-0.5 font-normal">
                {currentTrack.artist}
              </p>
            </div>

            {/* 3. Controls: Previous, Play/Pause, Next */}
            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handlePrev}
                title="Previous Track"
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <SkipBack className="w-3.5 h-3.5 fill-current" />
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
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <SkipForward className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Expand Button */}
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                title="Open Apple Music Player"
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                title="Close (S)"
                className="p-1 rounded-lg text-white/30 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Hairline Scrubber */}
          <div 
            onClick={handleSeek}
            className="mt-2 w-full h-1 bg-white/10 hover:bg-white/20 rounded-full overflow-hidden cursor-pointer relative transition-all"
          >
            <div 
              className="h-full bg-white/80 rounded-full transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================
          02 — EXPANDED PLAYER: Apple Music Aesthetic Modal Sheet
          Rendered via createPortal to document.body: NEVER CUT OFF!
          ======================================================== */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fade-in select-none">
          {/* Backdrop Click Closes Modal */}
          <div className="absolute inset-0" onClick={() => setIsExpanded(false)} />

          <div 
            className="relative w-full max-w-[350px] sm:max-w-[365px] rounded-[32px] bg-zinc-950/90 backdrop-blur-3xl border border-white/15 p-5 sm:p-6 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.9)] z-10 animate-modal-in overflow-hidden flex flex-col justify-between"
            style={{
              maxHeight: 'min(580px, calc(100dvh - 36px))',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Top Apple Grab Bar & Header */}
            <div className="flex flex-col items-center flex-shrink-0 mb-3">
              <div className="w-9 h-1 rounded-full bg-white/20 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-white/50 text-[11px] font-medium tracking-wide uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                  <span>Now Playing</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    title="Collapse to Pill"
                    className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExpanded(false);
                      onClose?.();
                    }}
                    title="Close (S)"
                    className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Large Apple-Style Rounded Artwork */}
            <div className="flex-1 flex items-center justify-center my-2 min-h-0">
              <div 
                className={`relative rounded-[24px] overflow-hidden border border-white/15 transition-all duration-500 ${
                  isPlaying 
                    ? 'w-44 h-44 sm:w-48 sm:h-48 scale-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.85)]' 
                    : 'w-40 h-40 sm:w-44 sm:h-44 scale-92 opacity-80 shadow-md'
                }`}
              >
                <img 
                  src={currentTrack.artwork} 
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Track Info (Title + Artist) */}
            <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate leading-tight drop-shadow-sm">
                  {currentTrack.title}
                </h3>
                <p className="text-xs text-white/55 truncate mt-0.5 font-normal">
                  {currentTrack.artist} • <span className="text-emerald-400/80">{currentTrack.mood}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPlaylist(prev => !prev)}
                title="Up Next Playlist"
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  showPlaylist ? 'bg-white/20 text-white' : 'text-white/40 hover:text-white hover:bg-white/10'
                }`}
              >
                <ListMusic className="w-4 h-4" />
              </button>
            </div>

            {/* Content Switch: Up Next Drawer vs Player Controls */}
            {showPlaylist ? (
              <div className="max-h-44 overflow-y-auto no-scrollbar border-t border-white/10 pt-2 flex flex-col gap-1 mb-2">
                {LOFI_PLAYLIST.map((track, idx) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => {
                      lofiAudio.selectTrack(idx);
                      setShowPlaylist(false);
                    }}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-colors cursor-pointer ${
                      audioState.currentTrackIndex === idx
                        ? 'bg-white/15 text-white font-medium'
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
            ) : (
              <>
                {/* Apple Music Progress Scrubber */}
                <div className="mb-3 px-1 flex-shrink-0">
                  <div 
                    onClick={handleSeek}
                    className="group w-full h-1 hover:h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer relative transition-all"
                  >
                    <div 
                      className="h-full bg-white/90 rounded-full transition-all duration-150"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40 mt-1.5 font-medium">
                    <span>{formatTime(audioState.currentTime)}</span>
                    <span>-{formatTime(Math.max(0, currentTrack.duration - audioState.currentTime))}</span>
                  </div>
                </div>

                {/* Iconic Apple Music Transport Buttons */}
                <div className="flex items-center justify-center gap-7 mb-4 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handlePrev}
                    title="Previous Track"
                    className="text-white/70 hover:text-white transition-colors cursor-pointer active:scale-90"
                  >
                    <SkipBack className="w-6 h-6 fill-current" />
                  </button>

                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    title={isPlaying ? "Pause" : "Play"}
                    className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    title="Next Track"
                    className="text-white/70 hover:text-white transition-colors cursor-pointer active:scale-90"
                  >
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                </div>

                {/* Apple Music Volume Scrubber */}
                <div className="flex items-center gap-3 px-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleVolumeToggle}
                    className="text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume1 className="w-3.5 h-3.5" />}
                  </button>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-white/15 rounded-full appearance-none cursor-pointer accent-white"
                  />
                  <Volume2 className="w-3.5 h-3.5 text-white/40" />
                </div>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
