import React, { useEffect, useState } from 'react';
import { 
  X, 
  Clock, 
  FileText, 
  CloudRain, 
  Sparkles, 
  Plus, 
  RotateCw, 
  VolumeX,
  Cloud,
  Music2
} from 'lucide-react';
import { subscribeAuth, signInWithGoogle } from '../services/firebase';

export default function AppTray({
  isOpen,
  onClose,
  onTogglePomodoro,
  isPomodoroVisible,
  onToggleSpotify,
  isSpotifyVisible,
  onOpenScratchpad,
  onNextWallpaper,
  onTriggerNewItem,
  onTriggerUpload,
  activeAmbient,
  onToggleAmbient
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = subscribeAuth((u) => setUser(u));
    return () => unsub();
  }, []);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-modal-in select-none"
      onClick={onClose}
    >
      {/* 3D Liquid Smoked Glass Tray */}
      <div 
        className="w-full max-w-xl p-5 sm:p-6 rounded-[28px] border border-white/20 shadow-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 23, 30, 0.85) 0%, rgba(10, 12, 16, 0.92) 100%)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          boxShadow: `
            0 30px 60px -15px rgba(0, 0, 0, 0.8),
            inset 0 1px 2px rgba(255, 255, 255, 0.25),
            inset 0 -1px 2px rgba(0, 0, 0, 0.6)
          `
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Glare */}
        <div 
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 70%)'
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white/80" />
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide">
              Productive Apps Tray
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] font-mono text-white/40">
              Toggle with <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">Right Shift</kbd>
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-4">
          {/* App 1: 3D Pomodoro Timer */}
          <button
            onClick={() => {
              onTogglePomodoro();
              onClose();
            }}
            className={`group flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isPomodoroVisible
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-white/80 hover:text-white hover:-translate-y-0.5'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Clock className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-xs font-semibold tracking-wide">Pomodoro 3D</span>
            <span className="text-[10px] text-white/40 font-mono mt-0.5">
              {isPomodoroVisible ? 'Active • 25m/5m' : 'Press P'}
            </span>
          </button>

          {/* App 2: Lo-Fi Music Player */}
          <button
            onClick={() => {
              onToggleSpotify?.();
              onClose();
            }}
            className={`group flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              isSpotifyVisible
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200 shadow-md'
                : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-white/80 hover:text-white hover:-translate-y-0.5'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform text-emerald-400">
              <Music2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-semibold tracking-wide">Lo-Fi Music</span>
            <span className="text-[10px] text-white/40 font-mono mt-0.5">
              {isSpotifyVisible ? 'Active' : 'Press S'}
            </span>
          </button>

          {/* App 2: Quick Scratchpad */}
          <button
            onClick={() => {
              onOpenScratchpad();
              onClose();
            }}
            className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-white/80 hover:text-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="text-xs font-semibold tracking-wide">Scratchpad</span>
            <span className="text-[10px] text-white/40 font-mono mt-0.5">Quick Notes</span>
          </button>

          {/* App 3: Ambient Rain Focus Noise */}
          <button
            onClick={() => onToggleAmbient('rain')}
            className={`group flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
              activeAmbient === 'rain'
                ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 shadow-md'
                : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 text-white/80 hover:text-white hover:-translate-y-0.5'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              {activeAmbient === 'rain' ? (
                <VolumeX className="w-5 h-5 text-sky-300" />
              ) : (
                <CloudRain className="w-5 h-5 text-sky-300" />
              )}
            </div>
            <span className="text-xs font-semibold tracking-wide">Rain Noise</span>
            <span className="text-[10px] text-white/40 font-mono mt-0.5">
              {activeAmbient === 'rain' ? 'Playing • Click stop' : 'Focus Audio'}
            </span>
          </button>

          {/* App 4: Google Cloud Firestore Sync */}
          <button
            onClick={() => {
              if (!user) {
                signInWithGoogle().catch(() => {});
              }
              onClose();
            }}
            className="group flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-white/80 hover:text-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-105 transition-transform ${
              user ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-blue-500/20 border border-blue-500/30'
            }`}>
              <Cloud className={`w-5 h-5 ${user ? 'text-emerald-300' : 'text-blue-300'}`} />
            </div>
            <span className="text-xs font-semibold tracking-wide">
              {user ? 'Cloud Synced' : 'Google Sync'}
            </span>
            <span className="text-[10px] text-white/40 font-mono mt-0.5 truncate max-w-[100px]">
              {user ? 'RTDB Live' : 'Click to Sign In'}
            </span>
          </button>
        </div>

        {/* Quick Actions Row */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              onTriggerNewItem();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs text-white/85 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task <kbd className="text-[10px] text-white/40 font-mono">N</kbd></span>
          </button>

          <button
            onClick={() => {
              onTriggerUpload();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs text-white/85 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload <kbd className="text-[10px] text-white/40 font-mono">O</kbd></span>
          </button>

          <button
            onClick={() => {
              onNextWallpaper();
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 text-xs text-white/85 transition-all cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Wallpaper</span>
          </button>
        </div>

        {/* Keyboard Shortcuts Summary Footer */}
        <div className="mt-3.5 pt-3 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/40 font-mono">
          <span className="flex items-center gap-1">
            <Keyboard className="w-3 h-3 text-white/50" />
            <span>Keyboard shortcuts:</span>
          </span>
          <div className="flex flex-wrap gap-2 text-white/60">
            <span><kbd className="px-1 bg-white/10 rounded">Esc</kbd> Home</span>
            <span><kbd className="px-1 bg-white/10 rounded">Right Shift</kbd> Tray</span>
            <span><kbd className="px-1 bg-white/10 rounded">P</kbd> Pomodoro</span>
            <span><kbd className="px-1 bg-white/10 rounded">N</kbd> New Task</span>
            <span><kbd className="px-1 bg-white/10 rounded">O</kbd> Upload</span>
            <span><kbd className="px-1 bg-white/10 rounded">Hold Del</kbd> Delete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
