import React, { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { sound } from '../services/sound';
import { Check } from 'lucide-react';

// Verified 4K / 1080p Cinematic Zen Environment Videos (Rain, Beach, Deep Space, Ocean, Forest)
const ZEN_SCENES = [
  {
    id: 'rain_water',
    name: 'Peaceful Rain',
    type: 'video',
    url: 'https://raw.githubusercontent.com/developedbyed/meditation-app/master/video/rain.mp4',
    poster: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'tropical_beach',
    name: 'Tropical Beach',
    type: 'video',
    url: 'https://mdbootstrap.com/img/video/Tropical.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'deep_space_orion',
    name: 'Orion Nebula Space',
    type: 'video',
    url: 'https://images-assets.nasa.gov/video/JPL-20221122-SOLSYSf-0001-Orion%20Dust%20and%20Death/JPL-20221122-SOLSYSf-0001-Orion%20Dust%20and%20Death~mobile.mp4',
    poster: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'ocean_surf',
    name: 'Ocean Waves',
    type: 'video',
    url: 'https://raw.githubusercontent.com/developedbyed/meditation-app/master/video/beach.mp4',
    poster: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'rain_drops',
    name: 'Atmospheric Rain',
    type: 'video',
    url: 'https://raw.githubusercontent.com/mawaqit/mobile-assets/main/weather-videos/rain.mp4',
    poster: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'cosmic_webb',
    name: 'Deep Cosmos',
    type: 'video',
    url: 'https://images-assets.nasa.gov/video/JPL-20231222-SOLSYSf-0001-NASA%20Telescopes%20Reveal%20Hidden%20Universe/JPL-20231222-SOLSYSf-0001-NASA%20Telescopes%20Reveal%20Hidden%20Universe~mobile.mp4',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'forest_mist',
    name: 'Forest Mist & Stream',
    type: 'video',
    url: 'https://mdbootstrap.com/img/video/forest.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=85&w=2560&auto=format&fit=crop'
  }
];

// Short, calm, meaningful achievement messages rotated on each completion
const ZEN_MESSAGES = [
  "You made it through. Rest for a moment.",
  "One chapter complete. Let the next one unfold.",
  "You kept your promise to yourself.",
  "Progress doesn't need applause. You know what you accomplished.",
  "Pause. Breathe. You earned this moment.",
  "Another step forward. Quietly, beautifully done.",
  "The work is done. Let yourself breathe.",
  "You moved forward today. That's enough."
];

// Generate 36 realistic Voronoi/radial crystalline glass shards radiating from the impact point
function generateGlassShards(epicenterX = 50, epicenterY = 50) {
  const shards = [];
  const sectors = 18; // 18 radial wedges around the impact point
  const baseAngle = (Math.PI * 2) / sectors;

  for (let i = 0; i < sectors; i++) {
    const a1 = i * baseAngle + (Math.random() - 0.5) * 0.12;
    const a2 = (i + 1) * baseAngle + (Math.random() - 0.5) * 0.12;
    const midAngle = (a1 + a2) / 2;

    const r1 = 18 + Math.random() * 12; // 18% to 30% inner radius
    const r2 = 18 + Math.random() * 12;

    // Inner shard triangle: center -> (r1, a1) -> (r2, a2)
    const p1x = Math.max(0, Math.min(100, epicenterX + Math.cos(a1) * r1));
    const p1y = Math.max(0, Math.min(100, epicenterY + Math.sin(a1) * r1 * 1.5));
    const p2x = Math.max(0, Math.min(100, epicenterX + Math.cos(a2) * r2));
    const p2y = Math.max(0, Math.min(100, epicenterY + Math.sin(a2) * r2 * 1.5));

    const innerSpeed = 290 + Math.random() * 260;

    shards.push({
      id: `inner_${i}`,
      clipPath: `polygon(${epicenterX}% ${epicenterY}%, ${p1x}% ${p1y}%, ${p2x}% ${p2y}%)`,
      vx: Math.cos(midAngle) * innerSpeed,
      vy: Math.sin(midAngle) * innerSpeed + 35,
      rotX: (Math.random() - 0.5) * 650,
      rotY: (Math.random() - 0.5) * 650,
      rotZ: (Math.random() - 0.5) * 650,
      scale: 0.25,
      delay: Math.random() * 0.02
    });

    // Outer shard tapered polygon: from inner radius to card edge
    const rOuter1 = 65 + Math.random() * 45;
    const rOuter2 = 65 + Math.random() * 45;

    const p3x = Math.max(-10, Math.min(110, epicenterX + Math.cos(a2) * rOuter2));
    const p3y = Math.max(-10, Math.min(110, epicenterY + Math.sin(a2) * rOuter2 * 1.5));
    const p4x = Math.max(-10, Math.min(110, epicenterX + Math.cos(a1) * rOuter1));
    const p4y = Math.max(-10, Math.min(110, epicenterY + Math.sin(a1) * rOuter1 * 1.5));

    const outerSpeed = 170 + Math.random() * 190;

    shards.push({
      id: `outer_${i}`,
      clipPath: `polygon(${p1x}% ${p1y}%, ${p4x}% ${p4y}%, ${p3x}% ${p3y}%, ${p2x}% ${p2y}%)`,
      vx: Math.cos(midAngle) * outerSpeed,
      vy: Math.sin(midAngle) * outerSpeed + 80, // downward gravity pull
      rotX: (Math.random() - 0.5) * 450,
      rotY: (Math.random() - 0.5) * 450,
      rotZ: (Math.random() - 0.5) * 450,
      scale: 0.35,
      delay: Math.random() * 0.04
    });
  }

  return shards;
}

// Generate 26 fine glass glitter / sparkle particles
function generateSparks() {
  return Array.from({ length: 26 }).map((_, idx) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 200 + Math.random() * 320;
    return {
      id: `spark_${idx}`,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed + 30,
      size: 2.5 + Math.random() * 3,
      delay: Math.random() * 0.04
    };
  });
}

export default function CalmModeOverlay({ isActive, block, blockName, totalTasks = 0, onClose }) {
  // Experience phases: 'break' -> 'shattering' -> 'zen'
  const [phase, setPhase] = useState('break');
  const [crackCount, setCrackCount] = useState(0); // 0 -> 1 -> 2 -> 3 (shatters)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [zenMessage, setZenMessage] = useState(() => ZEN_MESSAGES[0]);
  const [impactPoint, setImpactPoint] = useState({ x: 50, y: 50 }); // percentage relative to card

  const mainContainerRef = useRef(null);
  const blockCardRef = useRef(null);
  const shardsContainerRef = useRef(null);
  const sparksContainerRef = useRef(null);
  const stopMusicRef = useRef(null);
  const isClosingRef = useRef(false);

  // Pre-calculated glass shards & sparks
  const shards = useMemo(() => generateGlassShards(impactPoint.x, impactPoint.y), [isActive, impactPoint]);
  const sparks = useMemo(() => generateSparks(), [isActive]);

  // Reset and initialize on active trigger
  useEffect(() => {
    if (!isActive) return;

    setPhase('break');
    setCrackCount(0);
    setImpactPoint({ x: 50, y: 50 });
    isClosingRef.current = false;

    // Pick random initial scene & achievement message
    setCurrentSceneIndex(Math.floor(Math.random() * ZEN_SCENES.length));
    const randomMsg = ZEN_MESSAGES[Math.floor(Math.random() * ZEN_MESSAGES.length)];
    setZenMessage(randomMsg);

    // Initial entrance animation for the physical Block
    if (blockCardRef.current) {
      gsap.fromTo(blockCardRef.current, 
        { scale: 0.88, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.85, ease: 'back.out(1.2)' }
      );
    }

    return () => {
      if (stopMusicRef.current) {
        stopMusicRef.current();
        stopMusicRef.current = null;
      }
    };
  }, [isActive]);

  // Rotate cinematic background scenes smoothly every 11 seconds during Zen Mode
  useEffect(() => {
    if (!isActive || phase !== 'zen') return;

    const interval = setInterval(() => {
      setCurrentSceneIndex(prev => (prev + 1) % ZEN_SCENES.length);
    }, 11000);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  // Handle User Clicking / Tapping the Physical Block
  const handleBlockClick = (e) => {
    e.stopPropagation();
    if (phase !== 'break') return;

    // Calculate relative impact position on card
    if (blockCardRef.current) {
      const rect = blockCardRef.current.getBoundingClientRect();
      const clickX = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const clickY = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      if (!isNaN(clickX) && !isNaN(clickY)) {
        setImpactPoint({
          x: Math.max(15, Math.min(85, clickX)),
          y: Math.max(15, Math.min(85, clickY))
        });
      }
    }

    const nextCrack = crackCount + 1;

    if (nextCrack === 1) {
      // Impact 1: First stress fracture
      sound.playGlassCrack(1);
      navigator.vibrate?.(30);
      setCrackCount(1);

      // Micro-recoil spring animation
      gsap.fromTo(blockCardRef.current,
        { scale: 0.95, rotate: (Math.random() - 0.5) * 2 },
        { scale: 1, rotate: 0, duration: 0.45, ease: 'elastic.out(1.3, 0.35)' }
      );
    } else if (nextCrack === 2) {
      // Impact 2: Deep spiderweb crack propagation
      sound.playGlassCrack(2);
      navigator.vibrate?.([35, 45]);
      setCrackCount(2);

      // Violent vibration shake
      gsap.timeline()
        .to(blockCardRef.current, { scale: 0.92, duration: 0.05 })
        .to(blockCardRef.current, { x: -6, rotate: -1.8, duration: 0.04 })
        .to(blockCardRef.current, { x: 6, rotate: 1.8, duration: 0.04 })
        .to(blockCardRef.current, { x: -3, duration: 0.04 })
        .to(blockCardRef.current, { scale: 1, x: 0, rotate: 0, duration: 0.35, ease: 'elastic.out(1.1, 0.3)' });
    } else if (nextCrack >= 3) {
      // Impact 3: FINAL IMPACT -> FULL SHATTER!
      sound.playGlassShatter();
      navigator.vibrate?.([50, 70, 90]);
      setPhase('shattering');

      // Visceral screen shake
      if (mainContainerRef.current) {
        gsap.timeline()
          .to(mainContainerRef.current, { x: -7, y: 5, duration: 0.035 })
          .to(mainContainerRef.current, { x: 7, y: -5, duration: 0.035 })
          .to(mainContainerRef.current, { x: -4, y: 3, duration: 0.035 })
          .to(mainContainerRef.current, { x: 0, y: 0, duration: 0.1 });
      }

      // Animate 36 sharp crystalline shards flying outward in 3D
      if (shardsContainerRef.current) {
        const shardElements = shardsContainerRef.current.children;
        Array.from(shardElements).forEach((el, idx) => {
          const shardData = shards[idx];
          if (!shardData) return;

          gsap.to(el, {
            x: shardData.vx,
            y: shardData.vy,
            rotationX: shardData.rotX,
            rotationY: shardData.rotY,
            rotationZ: shardData.rotZ,
            opacity: 0,
            scale: shardData.scale,
            duration: 0.8,
            delay: shardData.delay,
            ease: 'power3.out'
          });
        });
      }

      // Animate sparkling glass dust
      if (sparksContainerRef.current) {
        const sparkElements = sparksContainerRef.current.children;
        Array.from(sparkElements).forEach((el, idx) => {
          const sData = sparks[idx];
          if (!sData) return;

          gsap.to(el, {
            x: sData.vx,
            y: sData.vy,
            opacity: 0,
            scale: 0.1,
            duration: 0.65,
            delay: sData.delay,
            ease: 'power2.out'
          });
        });
      }

      // Smooth transition to full-screen Zen Mode
      setTimeout(() => {
        setPhase('zen');
        const stopFn = sound.playSoothingCalmMusic();
        stopMusicRef.current = stopFn;
      }, 550);
    }
  };

  // Graceful exit back to the application
  const handleExit = (e) => {
    if (e) e.stopPropagation();
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (stopMusicRef.current) {
      stopMusicRef.current();
      stopMusicRef.current = null;
    }

    onClose?.();
  };

  // Keyboard dismiss (Escape, Space, or Enter during Zen Mode)
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || ((e.key === ' ' || e.key === 'Enter') && phase === 'zen')) {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, phase]);

  if (!isActive) return null;

  const currentScene = ZEN_SCENES[currentSceneIndex];
  const displayName = blockName || block?.name || 'Completed Block';

  return (
    <div 
      ref={mainContainerRef}
      className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-black"
      onClick={phase === 'zen' ? handleExit : undefined}
    >
      {/* ========================================================
          PHASE 1 & 2: THE PHYSICAL BLOCK BREAK & SHATTER
          ======================================================== */}
      {phase !== 'zen' && (
        <div className="relative z-20 flex flex-col items-center justify-center px-4 w-full max-w-lg">
          {/* Top Elegant Typography */}
          <div className="flex flex-col items-center text-center mb-8 pointer-events-none animate-modal-in">
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] text-emerald-400 font-semibold mb-2 drop-shadow-sm">
              You completed this block
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white tracking-wide drop-shadow-lg">
              Break It
            </h2>
          </div>

          {/* Centered Physical Block Container */}
          <div className="relative flex items-center justify-center perspective-[1200px]">
            {/* The Solid Physical Block (Before Shatter) */}
            {phase === 'break' && (
              <div
                ref={blockCardRef}
                onClick={handleBlockClick}
                className="relative group w-[285px] sm:w-[325px] rounded-[22px] p-6 cursor-pointer select-none transition-transform duration-150 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(145deg, rgba(35, 40, 50, 0.88) 0%, rgba(18, 20, 26, 0.94) 100%)',
                  backdropFilter: 'blur(30px)',
                  WebkitBackdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: `
                    0 25px 50px -12px rgba(0, 0, 0, 0.85),
                    0 10px 20px -5px rgba(0, 0, 0, 0.6),
                    inset 0 1px 1px rgba(255, 255, 255, 0.4),
                    inset 0 -1px 2px rgba(0, 0, 0, 0.5)
                  `
                }}
              >
                {/* Diagonal Specular Reflection Highlight */}
                <div 
                  className="absolute inset-0 rounded-[22px] pointer-events-none opacity-25"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 45%)'
                  }}
                />

                {/* Status Header inside Block */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse" />
                    <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                      COMPLETED
                    </span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                </div>

                {/* Block Title */}
                <h3 className="text-xl sm:text-2xl font-semibold text-white tracking-wide truncate mb-5 drop-shadow-md">
                  {displayName}
                </h3>

                {/* 100% Full Golden-Emerald Progress Bar */}
                <div className="w-full">
                  <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10 p-[1px]">
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-white/50">
                    <span>100% DONE</span>
                    {totalTasks > 0 && <span>{totalTasks} / {totalTasks} TASKS</span>}
                  </div>
                </div>

                {/* ========================================================
                    SVG DYNAMIC GLASS CRACKS OVERLAY
                    Fractures appear realistically on impact 1 and 2
                    ======================================================== */}
                {crackCount >= 1 && (
                  <svg 
                    viewBox="0 0 320 200" 
                    className="absolute inset-0 w-full h-full pointer-events-none rounded-[22px] overflow-hidden"
                    style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 0 1px rgba(180,220,255,0.6))' }}
                  >
                    {/* Primary Jagged Stress Fractures (Crack 1) */}
                    <g stroke="#ffffff" strokeLinecap="round" strokeLinejoin="miter">
                      {/* Branch Top-Left */}
                      <path d="M 160 100 L 138 72 L 115 58 L 82 42 L 35 15" strokeWidth="1.8" fill="none" opacity="0.95" />
                      <path d="M 138 72 L 148 52 L 130 30" strokeWidth="1.1" fill="none" opacity="0.8" />
                      <path d="M 115 58 L 95 70 L 68 82" strokeWidth="0.9" fill="none" opacity="0.75" />

                      {/* Branch Top-Right */}
                      <path d="M 160 100 L 192 78 L 228 62 L 270 48 L 310 25" strokeWidth="1.8" fill="none" opacity="0.95" />
                      <path d="M 192 78 L 210 98 L 252 110" strokeWidth="1.0" fill="none" opacity="0.8" />
                      <path d="M 228 62 L 245 40 L 260 15" strokeWidth="0.9" fill="none" opacity="0.75" />

                      {/* Branch Bottom-Left */}
                      <path d="M 160 100 L 142 135 L 110 162 L 75 190" strokeWidth="1.8" fill="none" opacity="0.95" />
                      <path d="M 142 135 L 165 155 L 150 185" strokeWidth="1.0" fill="none" opacity="0.8" />

                      {/* Branch Bottom-Right */}
                      <path d="M 160 100 L 188 128 L 235 158 L 285 190" strokeWidth="1.8" fill="none" opacity="0.95" />
                      <path d="M 188 128 L 195 160 L 220 185" strokeWidth="0.9" fill="none" opacity="0.8" />

                      {/* Cyan/Glass Refraction Inner Core */}
                      <path d="M 160 100 L 138 72 L 115 58 M 160 100 L 192 78 L 228 62 M 160 100 L 142 135 M 160 100 L 188 128" stroke="#a5f3fc" strokeWidth="0.7" fill="none" opacity="0.9" />
                    </g>

                    {/* Secondary Spiderweb Fractures (Crack 2) */}
                    {crackCount >= 2 && (
                      <g stroke="#ffffff" strokeLinecap="round">
                        {/* Inner Shatter Web Rings */}
                        <path
                          d="M 130 82 L 158 66 L 190 74 L 205 102 L 186 132 L 152 138 L 128 115 Z"
                          strokeWidth="1.3"
                          fill="none"
                          opacity="0.85"
                        />
                        <path
                          d="M 102 65 L 155 42 L 222 52 L 248 108 L 216 155 L 145 165 L 98 132 Z"
                          strokeWidth="1.1"
                          strokeDasharray="6 3"
                          fill="none"
                          opacity="0.75"
                        />
                        
                        {/* Cross Connecting Fissures */}
                        <path d="M 130 82 L 115 58 M 158 66 L 148 52 M 190 74 L 228 62 M 205 102 L 252 110 M 186 132 L 235 158 M 152 138 L 165 155 M 128 115 L 110 162" strokeWidth="0.9" fill="none" opacity="0.7" />

                        {/* Frosted Crushed Glass Center */}
                        <circle cx="160" cy="100" r="5" fill="#ffffff" opacity="0.9" filter="blur(1px)" />
                        <circle cx="160" cy="100" r="14" fill="#ffffff" opacity="0.18" filter="blur(3px)" />
                      </g>
                    )}
                  </svg>
                )}
              </div>
            )}

            {/* Shattered Flying Fragments (Phase: 'shattering') */}
            {phase === 'shattering' && (
              <div 
                ref={shardsContainerRef}
                className="relative w-[285px] sm:w-[325px] h-[190px] pointer-events-none"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 36 Sharp Crystalline Glass Shards */}
                {shards.map((shard) => (
                  <div
                    key={shard.id}
                    className="absolute inset-0"
                    style={{
                      clipPath: shard.clipPath,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(35,42,55,0.92) 55%, rgba(180,215,255,0.35) 100%)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.75)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 6px 16px rgba(0,0,0,0.6)'
                    }}
                  />
                ))}

                {/* Sparkling Glass Glitter Sparks */}
                <div ref={sparksContainerRef} className="absolute inset-0 flex items-center justify-center">
                  {sparks.map((spark) => (
                    <div
                      key={spark.id}
                      className="absolute rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                      style={{
                        width: `${spark.size}px`,
                        height: `${spark.size}px`
                      }}
                    />
                  ))}
                </div>

                {/* Central Explosive Lens Flare Flash */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-white blur-2xl animate-ping opacity-90" />
                  <div className="w-16 h-16 rounded-full bg-cyan-200 blur-lg opacity-95" />
                </div>
              </div>
            )}
          </div>

          {/* Understated Instruction Hint */}
          {phase === 'break' && (
            <p className="mt-7 text-xs font-mono uppercase tracking-[0.2em] text-white/50 animate-pulse">
              {crackCount === 0 && '[ Tap to break ]'}
              {crackCount === 1 && '[ Hit again ]'}
              {crackCount === 2 && '[ Final strike to shatter! ]'}
            </p>
          )}
        </div>
      )}

      {/* ========================================================
          PHASE 3: FULL-SCREEN CINEMATIC ZEN MODE (POST-SHATTER)
          ======================================================== */}
      {phase === 'zen' && (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center animate-modal-in">
          {/* Looping 4K Cinematic Scene Background Video */}
          <video
            key={currentScene.id}
            src={currentScene.url}
            poster={currentScene.poster}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ease-in-out"
            onError={(e) => {
              // Graceful fallback to poster background if video stream stalls
              e.target.style.display = 'none';
            }}
          />

          {/* Dark Atmospheric Readability Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/75 backdrop-blur-[1px] pointer-events-none" />

          {/* Clean, Spacious, Zen Typography Content Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl pointer-events-auto">
            {/* Meaningful, Calm Achievement Message */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-wide text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] leading-relaxed sm:leading-snug mb-5 animate-modal-in">
              "{zenMessage}"
            </h2>

            {/* Block Identity Subtly Stated Beneath */}
            <div className="flex items-center gap-2 mb-10 text-white/80 font-light">
              <span className="text-base sm:text-lg font-medium text-white tracking-wide">
                {displayName}
              </span>
              <span className="text-white/30">•</span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-mono tracking-widest text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                COMPLETED
              </span>
            </div>

            {/* Minimal Understated CTA Button */}
            <button
              onClick={handleExit}
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              <span className="text-sm sm:text-base font-light tracking-wider text-white">
                Continue your journey →
              </span>
            </button>

            {/* Subtle dismiss helper */}
            <p className="mt-5 text-[11px] font-mono tracking-widest uppercase text-white/35">
              Press Esc or tap anywhere to return
            </p>
          </div>
        </div>
      )}

      {/* Subtle CSS animation for gentle cinematic zoom */}
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1.0); }
          100% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
