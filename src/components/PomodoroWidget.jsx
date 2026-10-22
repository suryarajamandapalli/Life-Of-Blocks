import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { sound } from '../services/sound';

const STORAGE_KEY = 'lob_retro_pomodoro_state';

export default function PomodoroWidget({ isVisible, onClose }) {
  // Modes: 'focus' (25 mins) or 'break' (5 mins)
  const [mode, setMode] = useState('focus');
  const [sessionCount, setSessionCount] = useState(1);
  const [remaining, setRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const timerRef = useRef(null);

  // Restore state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode) setMode(parsed.mode);
        if (typeof parsed.sessionCount === 'number') setSessionCount(parsed.sessionCount);
        if (typeof parsed.isSoundMuted === 'boolean') setIsSoundMuted(parsed.isSoundMuted);
        if (typeof parsed.remaining === 'number') {
          if (parsed.isRunning && parsed.lastUpdated) {
            const elapsed = Math.floor((Date.now() - parsed.lastUpdated) / 1000);
            const newRemaining = Math.max(0, parsed.remaining - elapsed);
            setRemaining(newRemaining);
            setIsRunning(newRemaining > 0);
          } else {
            setRemaining(parsed.remaining);
            setIsRunning(false);
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore retro pomodoro state:', e);
    }
  }, []);

  // Save state on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode,
        sessionCount,
        remaining,
        isRunning,
        isSoundMuted,
        lastUpdated: Date.now()
      }));
    } catch (e) {
      console.warn('Could not save retro pomodoro state:', e);
    }
  }, [mode, sessionCount, remaining, isRunning, isSoundMuted]);

  // Timer countdown interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            if (!isSoundMuted) sound.playTimerCompletion();

            if (mode === 'focus') {
              setMode('break');
              return 5 * 60;
            } else {
              setMode('focus');
              setSessionCount(s => s + 1);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, isSoundMuted]);

  const toggleRun = () => {
    if (!isSoundMuted) sound.playTick();
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (!isSoundMuted) sound.playTick();
    setIsRunning(false);
    setRemaining(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const toggleMode = () => {
    if (!isSoundMuted) sound.playTick();
    const nextMode = mode === 'focus' ? 'break' : 'focus';
    setMode(nextMode);
    setIsRunning(false);
    setRemaining(nextMode === 'focus' ? 25 * 60 : 5 * 60);
  };

  if (!isVisible) return null;

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="fixed bottom-5 left-4 sm:left-6 z-40 select-none animate-modal-in transition-all duration-300"
      style={{ perspective: '1000px' }}
    >
      {/* ========================================================
          RETRO GAMEBOY / BRAUN PHYSICAL ELECTRONIC DEVICE CHASSIS
          Matte silver-gray handheld console casing
          ======================================================== */}
      <div 
        className="relative w-[268px] sm:w-[282px] rounded-[28px] p-3.5 sm:p-4 select-none"
        style={{
          background: 'linear-gradient(180deg, #c7cbd1 0%, #b5b9c0 50%, #a2a6ad 100%)',
          boxShadow: `
            0 24px 50px -10px rgba(0, 0, 0, 0.75),
            0 10px 20px -5px rgba(0, 0, 0, 0.45),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.85),
            inset 0 -2px 3px 0 rgba(0, 0, 0, 0.35)
          `,
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}
      >
        {/* Subtle Corner Close Button */}
        <button
          onClick={onClose}
          title="Hide Pomodoro (Press P to show)"
          className="absolute -top-2 -right-2 z-30 w-6 h-6 rounded-full bg-[#202226] text-white/70 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <X className="w-3 h-3 stroke-[2.5]" />
        </button>

        {/* ========================================================
            THICK DARK SCREEN BEZEL & SAGE GREEN LCD DISPLAY
            ======================================================== */}
        <div 
          className="rounded-[20px] p-2 mb-3"
          style={{
            background: '#202226',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.4)'
          }}
        >
          {/* Sage Greenish LCD Screen */}
          <div 
            className="w-full rounded-[14px] px-3 pt-2.5 pb-3 flex flex-col items-center justify-between relative overflow-hidden"
            style={{
              background: '#98ad86',
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.035) 50%, transparent 50%)',
              backgroundSize: '100% 4px',
              boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.35), inset 0 0 1px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header: SESSION 1 or BREAK (Clickable to switch mode) */}
            <div 
              onClick={toggleMode}
              title="Click to toggle Focus / Break"
              className="text-[10.5px] font-bold tracking-[0.18em] text-[#283621] uppercase cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 select-none"
            >
              <span>{mode === 'focus' ? `SESSION ${sessionCount}` : 'SHORT BREAK'}</span>
            </div>

            {/* Large Digital Clock Digits */}
            <div className="my-1.5 flex items-center justify-center">
              <span 
                className="text-[40px] sm:text-[44px] font-bold leading-none tracking-tight text-[#22311b]"
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  textShadow: '1px 1px 0 rgba(255, 255, 255, 0.15)'
                }}
              >
                {timeFormatted}
              </span>
            </div>

            {/* Pixel Art Sleeping Cat (Centered) */}
            <div className="relative mt-0.5 flex flex-col items-center justify-center">
              {/* Floating Pixel 'z z Z' when running */}
              {isRunning && (
                <div className="absolute -top-3 right-0 flex gap-0.5 text-[8px] font-mono font-bold text-[#283621] animate-bounce pointer-events-none opacity-75">
                  <span>z</span>
                  <span className="text-[9px]">z</span>
                  <span className="text-[10px]">Z</span>
                </div>
              )}

              {/* Exact Curled Sleeping Pixel Cat SVG */}
              <svg 
                viewBox="0 0 28 16" 
                className={`w-14 h-8 fill-current text-[#22311b] transition-transform duration-500 ${
                  isRunning ? 'scale-100' : 'scale-[0.98]'
                }`}
                shapeRendering="crispEdges"
              >
                {/* Left Ear */}
                <rect x="4" y="3" width="2" height="2" />
                <rect x="5" y="2" width="1" height="2" />
                {/* Right Ear */}
                <rect x="8" y="2" width="2" height="2" />
                <rect x="9" y="1" width="1" height="2" />
                {/* Head */}
                <rect x="3" y="5" width="8" height="6" />
                <rect x="2" y="6" width="9" height="4" />
                {/* Sleeping Eyes (inverted Sage cutouts) */}
                <rect x="3" y="7" width="2" height="1" fill="#98ad86" />
                <rect x="6" y="7" width="2" height="1" fill="#98ad86" />
                {/* Body & Curled Back */}
                <rect x="10" y="4" width="12" height="7" />
                <rect x="9" y="5" width="14" height="7" />
                <rect x="11" y="3" width="9" height="2" />
                <rect x="22" y="6" width="3" height="6" />
                {/* Tail wrapping around */}
                <rect x="11" y="12" width="12" height="2" />
                <rect x="7" y="11" width="6" height="2" />
                <rect x="16" y="13" width="5" height="1" />
              </svg>
            </div>
          </div>
        </div>

        {/* ========================================================
            PHYSICAL MECHANICAL PUSH BUTTONS (START & RESET)
            ======================================================== */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Left Button: Red START / PAUSE Button */}
          <button
            onClick={toggleRun}
            className="group relative h-[52px] rounded-xl p-2.5 flex flex-col justify-between transition-all duration-100 cursor-pointer text-left active:translate-y-[2px]"
            style={{
              background: 'linear-gradient(180deg, #d32824 0%, #b51c19 100%)',
              border: '1px solid #e64c48',
              boxShadow: isRunning 
                ? '0 2px 0 #7a1210, 0 3px 6px rgba(0,0,0,0.3)' 
                : '0 4px 0 #7a1210, 0 6px 10px rgba(0,0,0,0.35)',
              transform: isRunning ? 'translateY(2px)' : 'none'
            }}
          >
            {/* Label in top-left */}
            <span className="text-[10px] font-bold tracking-wider text-white uppercase drop-shadow-sm">
              {isRunning ? 'PAUSE' : 'START'}
            </span>

            {/* Pixel Sword Icon in bottom-right (from reference) */}
            <div className="self-end">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 drop-shadow-sm" shapeRendering="crispEdges">
                {/* Blade */}
                <rect x="9" y="3" width="2" height="2" fill="#e0f2fe" />
                <rect x="11" y="1" width="2" height="2" fill="#ffffff" />
                <rect x="7" y="5" width="2" height="2" fill="#bae6fd" />
                <rect x="5" y="7" width="2" height="2" fill="#7dd3fc" />
                {/* Guard / Crossbar */}
                <rect x="3" y="7" width="2" height="2" fill="#f59e0b" />
                <rect x="7" y="9" width="2" height="2" fill="#f59e0b" />
                {/* Grip / Pommel */}
                <rect x="2" y="10" width="2" height="2" fill="#ffffff" />
                <rect x="1" y="11" width="2" height="2" fill="#f59e0b" />
              </svg>
            </div>
          </button>

          {/* Right Button: Charcoal RESET Button */}
          <button
            onClick={handleReset}
            className="group relative h-[52px] rounded-xl p-2.5 flex flex-col justify-between transition-all duration-100 cursor-pointer text-left active:translate-y-[2px]"
            style={{
              background: 'linear-gradient(180deg, #3f4249 0%, #2e3036 100%)',
              border: '1px solid #545862',
              boxShadow: '0 4px 0 #1b1c20, 0 6px 10px rgba(0,0,0,0.35)'
            }}
          >
            {/* Label in top-left */}
            <span className="text-[10px] font-bold tracking-wider text-white/80 group-hover:text-white uppercase drop-shadow-sm">
              RESET
            </span>

            {/* Circular Arrow in bottom-right */}
            <div className="self-end text-white/70 group-hover:text-white transition-colors">
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
          </button>
        </div>

        {/* ========================================================
            BOTTOM SPEAKER GRILLE & SOUND TOGGLE
            ======================================================== */}
        <div className="flex items-center gap-2.5 pt-0.5 px-0.5">
          {/* Sound Toggle Button */}
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-7 h-7 rounded-lg bg-[#27292e] hover:bg-[#32353c] border border-black/20 text-white/75 hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-inner flex-shrink-0"
          >
            {isSoundMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Perforated Dot Matrix Speaker Grille */}
          <div className="flex-1 flex flex-col justify-center gap-[3px] py-1 opacity-70">
            {/* Row 1 */}
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 22 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
            {/* Row 2 */}
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 22 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
            {/* Row 3 */}
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 22 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
            {/* Row 4 */}
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 22 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}