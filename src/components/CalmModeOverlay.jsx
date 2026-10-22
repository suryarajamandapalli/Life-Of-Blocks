import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { sound } from '../services/sound';
import { ArrowRight } from 'lucide-react';

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
  const [theme, setTheme] = useState(() => CALM_THEMES[0]);
  const stopMusicRef = useRef(null);

  // GSAP animation refs
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const orbRef = useRef(null);
  const titleRef = useRef(null);
  const subRef = useRef(null);
  const badgeRef = useRef(null);
  const ctaRef = useRef(null);
  const breathTweenRef = useRef(null);
  const isClosingRef = useRef(false);

  // Entrance and active state management
  useEffect(() => {
    if (!isActive) return;

    // Pick random ambient theme
    const randomTheme = CALM_THEMES[Math.floor(Math.random() * CALM_THEMES.length)];
    setTheme(randomTheme);
    isClosingRef.current = false;

    // Start soothing soaking ambient music at slight volume
    const stopFn = sound.playSoothingCalmMusic();
    stopMusicRef.current = stopFn;

    // Run GSAP timeline for smooth, organic text and element entrances
    const ctx = gsap.context(() => {
      // Pre-set elements
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.set(videoRef.current, { opacity: 0, scale: 1.05 });
      gsap.set(orbRef.current, { opacity: 0, scale: 0.65 });
      gsap.set([titleRef.current, subRef.current, badgeRef.current, ctaRef.current].filter(Boolean), {
        opacity: 0,
        y: 28
      });

      const tl = gsap.timeline();

      // 1. Video backdrop fades in smoothly
      tl.to(videoRef.current, {
        opacity: 1,
        scale: 1.01,
        duration: 2.2,
        ease: 'power2.out'
      });

      // 2. Breathing Orb blossoms
      tl.to(orbRef.current, {
        opacity: 1,
        scale: 1,
        duration: 2.0,
        ease: 'power2.out'
      }, '-=1.6');

      // 3. "Take a deep breath" floats in softly
      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.6,
        ease: 'power3.out'
      }, '-=1.2');

      // 4. "You have just finished a block of important tasks in your life."
      tl.to(subRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.5,
        ease: 'power3.out'
      }, '-=1.1');

      // 5. Block Badge
      if (badgeRef.current) {
        tl.to(badgeRef.current, {
          opacity: 1,
          y: 0,
          duration: 1.2,
          ease: 'back.out(1.4)'
        }, '-=0.9');
      }

      // 6. "Complete more Blocks in your life" exit CTA
      tl.to(ctaRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'power2.out'
      }, '-=0.7');

      // 7. Continuous serene breathing loop on the orb
      breathTweenRef.current = gsap.to(orbRef.current, {
        scale: 1.1,
        duration: 4.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }, containerRef);

    return () => {
      ctx.revert();
      if (breathTweenRef.current) {
        breathTweenRef.current.kill();
      }
      if (stopMusicRef.current) {
        stopMusicRef.current();
        stopMusicRef.current = null;
      }
    };
  }, [isActive]);

  // Graceful exit with GSAP fade-out (No 10s timeout — only user triggers exit)
  const handleExit = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (stopMusicRef.current) {
      stopMusicRef.current();
      stopMusicRef.current = null;
    }

    if (containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.75,
        ease: 'power2.inOut',
        onComplete: () => {
          onClose?.();
        }
      });
    } else {
      onClose?.();
    }
  };

  // Keyboard dismiss (Escape, Space, or Enter)
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
      ref={containerRef}
      onClick={handleExit}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
      style={{ backgroundColor: '#000' }}
    >
      {/* 4K Looping Ambient Video Background (Ocean, Nature, Space, Rain) */}
      <video
        ref={videoRef}
        key={theme.id}
        src={theme.videoUrl}
        poster={theme.poster}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-[12000ms] ease-out"
      />

      {/* Atmospheric Soft Dark Scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70 backdrop-blur-[1.5px] pointer-events-none" />

      {/* Main Calm Prompt & Content Container */}
      <div 
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-xl pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          handleExit();
        }}
      >
        {/* Soft Glowing Breathing Orb with Continuous GSAP Breathing */}
        <div 
          ref={orbRef}
          className="relative w-28 h-28 sm:w-36 sm:h-36 mb-8 sm:mb-10 flex items-center justify-center"
        >
          <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" />
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center">
            <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-tr from-white/25 to-white/10 backdrop-blur-xl shadow-2xl flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-white/95 shadow-[0_0_14px_rgba(255,255,255,0.95)]" />
            </div>
          </div>
        </div>

        {/* Primary Prompt: "Take a deep breath" (GSAP Animated) */}
        <h2 
          ref={titleRef}
          className="text-3xl sm:text-4xl md:text-5xl font-light tracking-wide text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.9)] mb-3 sm:mb-4"
        >
          Take a deep breath
        </h2>

        {/* Secondary Prompt: "You have just finished a block of important tasks in your life." */}
        <p 
          ref={subRef}
          className="text-[15px] sm:text-lg text-white/90 font-light tracking-wide max-w-md drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] leading-relaxed"
        >
          You have just finished a block of important tasks in your life.
        </p>

        {/* Completed Block Badge */}
        {blockName && (
          <div 
            ref={badgeRef}
            className="mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md shadow-lg"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-xs sm:text-sm font-medium tracking-wider text-white">
              {blockName}
            </span>
          </div>
        )}

        {/* Zen Mode Exit Prompt Button (GSAP Animated)
            "Complete more Blocks in your life" */}
        <button
          ref={ctaRef}
          onClick={(e) => {
            e.stopPropagation();
            handleExit();
          }}
          className="mt-12 sm:mt-16 group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 backdrop-blur-md shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="text-sm sm:text-[15px] font-normal tracking-wide text-white drop-shadow-sm">
            Complete more Blocks in your life
          </span>
          <ArrowRight className="w-4 h-4 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>

        <p className="mt-4 text-[11px] tracking-widest uppercase text-white/35">
          Tap anywhere or press Esc to return
        </p>
      </div>
    </div>
  );
}
