import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../services/sound';

const CALM_THEMES = [
  {
    id: 'ocean',
    name: 'Ocean Waters',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop'
  },
  {
    id: 'nature',
    name: 'Mountain Forest River',
    videoUrl: 'https://assets.codepen.io/6093409/river.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1920&auto=format&fit=crop'
  },
  {
    id: 'space',
    name: 'Deep Cosmic Nebula',
    videoUrl: 'https://assets.codepen.io/3364143/7btrrd.mp4',
    poster: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=80&w=1920&auto=format&fit=crop'
  },
  {
    id: 'rain',
    name: 'Peaceful Rain',
    videoUrl: 'https://cdn.dribbble.com/userupload/45760229/file/2937f349ce2c08ce0bdc721a87a78796.mp4',
    poster: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1920&auto=format&fit=crop'
  }
];

export default function CalmModeOverlay({ isActive, blockName, onClose }) {
  const [timeLeft, setTimeLeft] = useState(10);
  const [theme, setTheme] = useState(() => CALM_THEMES[0]);
  const [isClosing, setIsClosing] = useState(false);
  const stopMusicRef = useRef(null);

  // When Calm Mode becomes active, pick a random 4K theme and start the 10s timer & music
  useEffect(() => {
    if (!isActive) return;

    // Pick a random ambient theme (Ocean, Nature, Space, Rain)
    const randomTheme = CALM_THEMES[Math.floor(Math.random() * CALM_THEMES.length)];
    setTheme(randomTheme);
    setTimeLeft(10);
    setIsClosing(false);

    // Start soothing soaking ambient music at slight volume
    const stopFn = sound.playSoothingCalmMusic();
    stopMusicRef.current = stopFn;

    // 10-second countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      if (stopMusicRef.current) {
        stopMusicRef.current();
        stopMusicRef.current = null;
      }
    };
  }, [isActive]);

  const handleExit = () => {
    setIsClosing(true);
    if (stopMusicRef.current) {
      stopMusicRef.current();
      stopMusicRef.current = null;
    }
    setTimeout(() => {
      onClose?.();
      setIsClosing(false);
    }, 700);
  };

  // Keyboard dismiss (Escape or Enter)
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div 
      onClick={handleExit}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden transition-opacity duration-700 ease-out ${
        isClosing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ backgroundColor: '#000' }}
    >
      {/* 4K Looping Video Background (Ocean, Nature, Space, Rain) */}
      <video
        key={theme.id}
        src={theme.videoUrl}
        poster={theme.poster}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none transition-transform duration-[12000ms] ease-out"
        style={{ transform: isClosing ? 'scale(1.08)' : 'scale(1.02)' }}
      />

      {/* Atmospheric Soft Dark Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65 backdrop-blur-[1.5px] pointer-events-none" />

      {/* Main Calm Prompt & Content */}
      <div 
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl animate-fade-in pointer-events-auto"
        onClick={(e) => {
          // Allow click anywhere on the backdrop to exit
          e.stopPropagation();
          handleExit();
        }}
      >
        {/* Soft Glowing Breathing Orb */}
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-8 sm:mb-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl animate-pulse" />
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center animate-ping-slow">
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-white/25 to-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.9)] animate-pulse" />
            </div>
          </div>
        </div>

        {/* Primary Prompt: "Take a deep breath" */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] mb-3 sm:mb-4">
          Take a deep breath
        </h2>

        {/* Secondary Prompt: "You have just finished a block of important tasks in your life." */}
        <p className="text-[15px] sm:text-lg text-white/90 font-light tracking-wide max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-relaxed">
          You have just finished a block of important tasks in your life.
        </p>

        {/* Completed Block Badge */}
        {blockName && (
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs sm:text-sm font-medium tracking-wider text-white">
              {blockName}
            </span>
          </div>
        )}

        {/* 10-Second Visual Timer Progress Bar */}
        <div className="mt-10 sm:mt-12 flex items-center gap-3">
          <div className="w-36 sm:w-48 h-1 rounded-full bg-white/20 overflow-hidden backdrop-blur-xs">
            <div 
              className="h-full bg-white rounded-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${(timeLeft / 10) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-white/70">
            {timeLeft}s
          </span>
        </div>

        <p className="mt-4 text-[11px] tracking-widest uppercase text-white/40">
          Tap anywhere to continue
        </p>
      </div>
    </div>
  );
}
