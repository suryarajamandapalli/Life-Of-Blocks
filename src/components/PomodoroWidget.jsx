import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Volume2, VolumeX, X, SlidersHorizontal, Check, Plus, Minus } from 'lucide-react';
import { sound } from '../services/sound';

const STORAGE_KEY = 'lob_retro_pomodoro_state_v2';

export default function PomodoroWidget({ isVisible, onClose, onToggleSpotify, isSpotifyVisible }) {
  // Initialize state lazily from localStorage so page reload NEVER resets to default 25:00
  const [timerState, setTimerState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const focusHours = typeof parsed.focusHours === 'number' ? parsed.focusHours : 0;
        const focusMinutes = typeof parsed.focusMinutes === 'number' ? parsed.focusMinutes : 25;
        const breakMinutes = typeof parsed.breakMinutes === 'number' ? parsed.breakMinutes : 5;
        const mode = parsed.mode === 'break' ? 'break' : 'focus';
        const sessionCount = typeof parsed.sessionCount === 'number' ? parsed.sessionCount : 1;
        const isSoundMuted = Boolean(parsed.isSoundMuted);

        const totalFocusSec = (focusHours * 60 + focusMinutes) * 60;
        const totalBreakSec = breakMinutes * 60;
        const totalSec = mode === 'focus' ? totalFocusSec : totalBreakSec;

        let isRunning = Boolean(parsed.isRunning);
        let targetEndTime = parsed.targetEndTime || null;
        let remaining = typeof parsed.remaining === 'number' ? parsed.remaining : totalSec;

        // If it was running when refreshed, calculate exact real-time remaining
        if (isRunning && targetEndTime) {
          const now = Date.now();
          const left = Math.round((targetEndTime - now) / 1000);
          if (left > 0) {
            remaining = left;
            isRunning = true;
          } else {
            // Completed while offline / closed
            remaining = 0;
            isRunning = false;
            targetEndTime = null;
          }
        } else {
          isRunning = false;
          targetEndTime = null;
        }

        return {
          mode,
          sessionCount,
          focusHours,
          focusMinutes,
          breakMinutes,
          remaining,
          isRunning,
          targetEndTime,
          isSoundMuted
        };
      }
    } catch (e) {
      console.warn('Could not restore retro pomodoro state:', e);
    }

    return {
      mode: 'focus',
      sessionCount: 1,
      focusHours: 0,
      focusMinutes: 25,
      breakMinutes: 5,
      remaining: 25 * 60,
      isRunning: false,
      targetEndTime: null,
      isSoundMuted: false
    };
  });

  const {
    mode,
    sessionCount,
    focusHours,
    focusMinutes,
    breakMinutes,
    remaining,
    isRunning,
    targetEndTime,
    isSoundMuted
  } = timerState;

  // Toggle duration editing mode inside the LCD screen
  const [isEditingDurations, setIsEditingDurations] = useState(false);

  // Local draft values while editing
  const [editFocusH, setEditFocusH] = useState(focusHours);
  const [editFocusM, setEditFocusM] = useState(focusMinutes);
  const [editBreakM, setEditBreakM] = useState(breakMinutes);

  // Synchronize edit draft with saved values when opening editor
  useEffect(() => {
    if (isEditingDurations) {
      setEditFocusH(focusHours);
      setEditFocusM(focusMinutes);
      setEditBreakM(breakMinutes);
    }
  }, [isEditingDurations, focusHours, focusMinutes, breakMinutes]);

  // Save state immediately on any change to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(timerState));
    } catch (e) {
      console.warn('Could not save retro pomodoro state:', e);
    }
  }, [timerState]);

  // Wall-clock synced interval countdown (resilient to tab throttling and system sleeps)
  useEffect(() => {
    let interval = null;

    if (isRunning && targetEndTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.round((targetEndTime - now) / 1000));

        setTimerState((prev) => {
          if (diff <= 0) {
            if (!prev.isSoundMuted) {
              sound.playTimerCompletion();
            }

            // Mode switch upon completion
            if (prev.mode === 'focus') {
              const nextSec = prev.breakMinutes * 60;
              return {
                ...prev,
                mode: 'break',
                remaining: nextSec,
                isRunning: false,
                targetEndTime: null
              };
            } else {
              const nextSec = (prev.focusHours * 60 + prev.focusMinutes) * 60;
              return {
                ...prev,
                mode: 'focus',
                sessionCount: prev.sessionCount + 1,
                remaining: nextSec,
                isRunning: false,
                targetEndTime: null
              };
            }
          }

          return {
            ...prev,
            remaining: diff
          };
        });
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, targetEndTime]);

  // Start / Pause
  const toggleRun = () => {
    if (!isSoundMuted) sound.playTick();

    if (isRunning) {
      // Pause: capture current remaining and clear targetEndTime
      const currentDiff = targetEndTime ? Math.max(0, Math.round((targetEndTime - Date.now()) / 1000)) : remaining;
      setTimerState((prev) => ({
        ...prev,
        isRunning: false,
        remaining: currentDiff,
        targetEndTime: null
      }));
    } else {
      // Start: set targetEndTime from remaining
      const totalSec = mode === 'focus' ? (focusHours * 60 + focusMinutes) * 60 : breakMinutes * 60;
      const durationToRun = remaining > 0 ? remaining : totalSec;
      const target = Date.now() + durationToRun * 1000;

      setTimerState((prev) => ({
        ...prev,
        isRunning: true,
        remaining: durationToRun,
        targetEndTime: target
      }));
    }
  };

  // Explicit Reset only when user clicks the physical RESET button
  const handleReset = () => {
    if (!isSoundMuted) sound.playTick();
    const totalSec = mode === 'focus' ? (focusHours * 60 + focusMinutes) * 60 : breakMinutes * 60;
    setTimerState((prev) => ({
      ...prev,
      isRunning: false,
      remaining: totalSec,
      targetEndTime: null
    }));
  };

  // Toggle between Focus and Break modes
  const toggleMode = () => {
    if (!isSoundMuted) sound.playTick();
    const nextMode = mode === 'focus' ? 'break' : 'focus';
    const totalSec = nextMode === 'focus' ? (focusHours * 60 + focusMinutes) * 60 : breakMinutes * 60;

    setTimerState((prev) => ({
      ...prev,
      mode: nextMode,
      isRunning: false,
      remaining: totalSec,
      targetEndTime: null
    }));
  };

  // Apply custom duration settings
  const handleSaveDurations = () => {
    if (!isSoundMuted) sound.playTick();

    const sanitizedH = Math.max(0, Math.min(12, editFocusH));
    let sanitizedM = Math.max(0, Math.min(59, editFocusM));
    if (sanitizedH === 0 && sanitizedM === 0) sanitizedM = 1; // Minimum 1 minute
    const sanitizedBreak = Math.max(1, Math.min(60, editBreakM));

    const totalFocusSec = (sanitizedH * 60 + sanitizedM) * 60;
    const totalBreakSec = sanitizedBreak * 60;

    setTimerState((prev) => {
      // If timer is not running, update remaining immediately
      const newRemaining = !prev.isRunning
        ? (prev.mode === 'focus' ? totalFocusSec : totalBreakSec)
        : prev.remaining;

      return {
        ...prev,
        focusHours: sanitizedH,
        focusMinutes: sanitizedM,
        breakMinutes: sanitizedBreak,
        remaining: newRemaining
      };
    });

    setIsEditingDurations(false);
  };

  // Quick preset helper
  const applyPreset = (h, m, b) => {
    if (!isSoundMuted) sound.playTick();
    setEditFocusH(h);
    setEditFocusM(m);
    setEditBreakM(b);
  };

  if (!isVisible) return null;

  // Format time display
  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  const timeFormatted = hrs > 0
    ? `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(mins).padStart(2, '0')} : ${String(secs).padStart(2, '0')}`;

  return (
    <div
      className="relative select-none animate-modal-in transition-all duration-300 w-full max-w-[280px] sm:w-[285px] flex-shrink-0"
      style={{ perspective: '1000px' }}
    >
      {/* ========================================================
          RETRO GAMEBOY / BRAUN PHYSICAL ELECTRONIC DEVICE CHASSIS
          ======================================================== */}
      <div 
        className="relative w-full rounded-[28px] p-3.5 sm:p-4 select-none"
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
        {/* Corner Close Button */}
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
            className="w-full rounded-[14px] px-3 pt-2.5 pb-2.5 flex flex-col items-center justify-between relative overflow-hidden min-h-[142px]"
            style={{
              background: '#98ad86',
              backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.035) 50%, transparent 50%)',
              backgroundSize: '100% 4px',
              boxShadow: 'inset 0 3px 6px rgba(0, 0, 0, 0.35), inset 0 0 1px rgba(0, 0, 0, 0.5)'
            }}
          >
            {isEditingDurations ? (
              /* ========================================================
                 CUSTOM DURATION CONFIGURATION VIEW (HOURS, MINS & BREAK)
                 ======================================================== */
              <div className="w-full flex flex-col justify-between h-full py-0.5">
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-[#283621]/20">
                  <span className="text-[10px] font-bold tracking-[0.16em] text-[#283621] uppercase">
                    SET DURATIONS
                  </span>
                  <button
                    onClick={handleSaveDurations}
                    title="Save & Close"
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#283621]/15 hover:bg-[#283621]/25 text-[#22311b] text-[9.5px] font-bold cursor-pointer active:scale-95"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
                    <span>DONE</span>
                  </button>
                </div>

                {/* Focus Duration (Hours + Minutes) */}
                <div className="my-1.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#283621]">
                    <span>FOCUS (POMO)</span>
                    <span className="font-mono text-[9px] opacity-80">
                      {editFocusH > 0 ? `${editFocusH}h ` : ''}{editFocusM}m
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {/* Hours Stepper */}
                    <div className="flex items-center justify-between bg-[#283621]/10 rounded-lg px-1.5 py-0.5 border border-[#283621]/20">
                      <button
                        type="button"
                        onClick={() => setEditFocusH(h => Math.max(0, h - 1))}
                        className="w-5 h-5 flex items-center justify-center font-bold text-[#22311b] hover:bg-[#283621]/20 rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="font-mono text-[11px] font-bold text-[#22311b]">
                        {editFocusH}h
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditFocusH(h => Math.min(12, h + 1))}
                        className="w-5 h-5 flex items-center justify-center font-bold text-[#22311b] hover:bg-[#283621]/20 rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Minutes Stepper */}
                    <div className="flex items-center justify-between bg-[#283621]/10 rounded-lg px-1.5 py-0.5 border border-[#283621]/20">
                      <button
                        type="button"
                        onClick={() => setEditFocusM(m => Math.max(editFocusH === 0 ? 1 : 0, m - 5))}
                        className="w-5 h-5 flex items-center justify-center font-bold text-[#22311b] hover:bg-[#283621]/20 rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="font-mono text-[11px] font-bold text-[#22311b]">
                        {editFocusM}m
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditFocusM(m => Math.min(59, m + 5))}
                        className="w-5 h-5 flex items-center justify-center font-bold text-[#22311b] hover:bg-[#283621]/20 rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Break Duration (Minutes) */}
                <div className="mb-1.5 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#283621]">
                    <span>BREAK TIME</span>
                    <span className="font-mono text-[9px] opacity-80">{editBreakM}m</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#283621]/10 rounded-lg px-2 py-0.5 border border-[#283621]/20">
                    <button
                      type="button"
                      onClick={() => setEditBreakM(b => Math.max(1, b - 1))}
                      className="w-5 h-5 flex items-center justify-center font-bold text-[#22311b] hover:bg-[#283621]/20 rounded cursor-pointer"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="font-mono text-[11px] font-bold text-[#22311b]">
                      {editBreakM} mins
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditBreakM(b => Math.min(60, b + 1))}
                      className="w-5 h-5 flex items-center justify-center font-bold text-[#22311b] hover:bg-[#283621]/20 rounded cursor-pointer"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-[#283621]/20">
                  <button
                    type="button"
                    onClick={() => applyPreset(0, 25, 5)}
                    className="flex-1 py-0.5 rounded bg-[#283621]/15 hover:bg-[#283621]/25 text-[9px] font-bold text-[#22311b] cursor-pointer"
                  >
                    25/5
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(0, 50, 10)}
                    className="flex-1 py-0.5 rounded bg-[#283621]/15 hover:bg-[#283621]/25 text-[9px] font-bold text-[#22311b] cursor-pointer"
                  >
                    50/10
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(1, 0, 10)}
                    className="flex-1 py-0.5 rounded bg-[#283621]/15 hover:bg-[#283621]/25 text-[9px] font-bold text-[#22311b] cursor-pointer"
                  >
                    1h/10
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset(1, 30, 15)}
                    className="flex-1 py-0.5 rounded bg-[#283621]/15 hover:bg-[#283621]/25 text-[9px] font-bold text-[#22311b] cursor-pointer"
                  >
                    1.5h/15
                  </button>
                </div>
              </div>
            ) : (
              /* ========================================================
                 STANDARD RETRO LCD CLOCK VIEW WITH CAT ANIMATION
                 ======================================================== */
              <>
                {/* Header: SESSION 1 or BREAK (Click to toggle mode) */}
                <div className="w-full flex items-center justify-between">
                  <div 
                    onClick={toggleMode}
                    title="Click to toggle Focus / Break"
                    className="text-[10px] font-bold tracking-[0.18em] text-[#283621] uppercase cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-1 select-none"
                  >
                    <span>{mode === 'focus' ? `SESSION ${sessionCount}` : 'SHORT BREAK'}</span>
                  </div>

                  {/* Mode Duration Badge (Click to open duration editor) */}
                  <button
                    onClick={() => setIsEditingDurations(true)}
                    title="Click to change hours & minutes"
                    className="text-[9px] font-mono font-bold text-[#283621]/80 hover:text-[#283621] bg-[#283621]/10 hover:bg-[#283621]/20 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {mode === 'focus' 
                      ? (focusHours > 0 ? `${focusHours}h ${focusMinutes}m` : `${focusMinutes}m`) 
                      : `${breakMinutes}m`}
                  </button>
                </div>

                {/* Large Digital Clock Digits (Clickable to edit duration) */}
                <div 
                  onClick={() => setIsEditingDurations(true)}
                  title="Click to edit timer duration"
                  className="my-1 flex items-center justify-center cursor-pointer group"
                >
                  <span 
                    className={`font-bold leading-none tracking-tight text-[#22311b] group-hover:scale-102 transition-transform ${
                      hrs > 0 ? 'text-[28px] sm:text-[32px]' : 'text-[40px] sm:text-[44px]'
                    }`}
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

                  {/* Curled Sleeping Pixel Cat SVG */}
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
              </>
            )}
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

            {/* Pixel Sword Icon in bottom-right */}
            <div className="self-end">
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 drop-shadow-sm" shapeRendering="crispEdges">
                <rect x="9" y="3" width="2" height="2" fill="#e0f2fe" />
                <rect x="11" y="1" width="2" height="2" fill="#ffffff" />
                <rect x="7" y="5" width="2" height="2" fill="#bae6fd" />
                <rect x="5" y="7" width="2" height="2" fill="#7dd3fc" />
                <rect x="3" y="7" width="2" height="2" fill="#f59e0b" />
                <rect x="7" y="9" width="2" height="2" fill="#f59e0b" />
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
            BOTTOM BAR: SOUND TOGGLE, DURATION SETTINGS & SPEAKER GRILLE
            ======================================================== */}
        <div className="flex items-center gap-2 pt-0.5 px-0.5">
          {/* Sound Toggle Button */}
          <button
            onClick={() => setTimerState(prev => ({ ...prev, isSoundMuted: !prev.isSoundMuted }))}
            title={isSoundMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-7 h-7 rounded-lg bg-[#27292e] hover:bg-[#32353c] border border-black/20 text-white/75 hover:text-white flex items-center justify-center cursor-pointer transition-colors shadow-inner flex-shrink-0"
          >
            {isSoundMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {/* Settings / Adjust Durations Button */}
          <button
            onClick={() => setIsEditingDurations(!isEditingDurations)}
            title={isEditingDurations ? 'Back to Clock' : 'Adjust Focus & Break Times'}
            className={`w-7 h-7 rounded-lg border border-black/20 flex items-center justify-center cursor-pointer transition-colors shadow-inner flex-shrink-0 ${
              isEditingDurations 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-[#27292e] hover:bg-[#32353c] text-white/75 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Spotify Player Toggle Button */}
          {onToggleSpotify && (
            <button
              onClick={onToggleSpotify}
              title={isSpotifyVisible ? 'Close Spotify Player (S)' : 'Open Spotify Player (S)'}
              className={`w-7 h-7 rounded-lg border border-black/20 flex items-center justify-center cursor-pointer transition-colors shadow-inner flex-shrink-0 ${
                isSpotifyVisible 
                  ? 'bg-[#1DB954]/25 text-[#1DB954] border-[#1DB954]/50 shadow-[0_0_8px_rgba(29,185,84,0.3)]' 
                  : 'bg-[#27292e] hover:bg-[#32353c] text-white/75 hover:text-[#1DB954]'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" shapeRendering="geometricPrecision">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.586 14.424a.623.623 0 01-.857.207c-2.348-1.434-5.304-1.758-8.786-.963a.624.624 0 11-.278-1.218c3.808-.87 7.076-.502 9.714 1.117a.625.625 0 01.207.857zm1.225-2.723a.78.78 0 01-1.072.257c-2.687-1.652-6.784-2.131-9.964-1.166a.78.78 0 11-.453-1.493c3.633-1.103 8.147-.568 11.232 1.33a.78.78 0 01.257 1.072zm.105-2.836C14.692 8.97 9.4 8.795 6.34 9.724a.936.936 0 11-.546-1.79c3.51-1.066 9.356-.864 13.064 1.337a.936.936 0 01-1.073 1.594z"/>
              </svg>
            </button>
          )}

          {/* Perforated Dot Matrix Speaker Grille */}
          <div className="flex-1 flex flex-col justify-center gap-[3px] py-1 opacity-70">
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
            <div className="flex justify-between items-center px-1">
              {Array.from({ length: 18 }).map((_, i) => (
                <span key={i} className="w-[2.5px] h-[2.5px] rounded-full bg-[#2c2f35] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.9)]" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
