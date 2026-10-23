import React, { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { sound } from '../services/sound';
import { ArrowRight, Check } from 'lucide-react';

// Cinematic Zen Environments (Nature, Rain, Ocean, Space, Forest, Clouds, Mountains)
const ZEN_SCENES = [
  {
    id: 'rain',
    name: 'Peaceful Rain',
    type: 'video',
    url: 'https://cdn.dribbble.com/userupload/45760229/file/2937f349ce2c08ce0bdc721a87a78796.mp4',
    poster: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'ocean_waves',
    name: 'Ocean Waters',
    type: 'video',
    url: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'forest_stream',
    name: 'Forest Mist',
    type: 'video',
    url: 'https://res.cloudinary.com/demo/video/upload/forest_bike.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'deep_space',
    name: 'Cosmic Nebula',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=85&w=2560&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'aurora_sky',
    name: 'Celestial Aurora',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=85&w=2560&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'sunset_peaks',
    name: 'Mountain Sunset',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=85&w=2560&auto=format&fit=crop',
    poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=85&w=2560&auto=format&fit=crop'
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

// Generate 24 realistic glass fracture shards across the rectangular card
function generateGlassShards() {
  const cols = 6;
  const rows = 4;
  const shards = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x0 = (c / cols) * 100;
      const y0 = (r / rows) * 100;
      const x1 = ((c + 1) / cols) * 100;
      const y1 = ((r + 1) / rows) * 100;

      // Add natural organic jitter to inner vertices
      const jx0 = c === 0 ? 0 : x0 + (Math.random() - 0.5) * 4;
      const jy0 = r === 0 ? 0 : y0 + (Math.random() - 0.5) * 4;
      const jx1 = c + 1 === cols ? 100 : x1 + (Math.random() - 0.5) * 4;
      const jy1 = r + 1 === rows ? 100 : y1 + (Math.random() - 0.5) * 4;

      // Center point of this shard relative to card center (50, 50)
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;
      const dx = cx - 50;
      const dy = cy - 50;
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
      const speed = 180 + Math.random() * 220;

      shards.push({
        id: `shard_${r}_${c}`,
        clipPath: `polygon(${jx0}% ${jy0}%, ${jx1}% ${jy0}%, ${jx1}% ${jy1}%, ${jx0}% ${jy1}%)`,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 30, // slight gravity
        rotation: (Math.random() - 0.5) * 600,
        delay: Math.random() * 0.04
      });
    }
  }

  return shards;
}

export default function CalmModeOverlay({ isActive, block, blockName, totalTasks = 0, onClose }) {
  // Experience phases: 'break' (prompt + physical block) -> 'shattering' -> 'zen' (cinematic environment)
  const [phase, setPhase] = useState('break');
  const [crackCount, setCrackCount] = useState(0); // 0 -> 1 -> 2 -> 3 (shatters)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [zenMessage, setZenMessage] = useState(() => ZEN_MESSAGES[0]);

  const blockCardRef = useRef(null);
  const shardsContainerRef = useRef(null);
  const stopMusicRef = useRef(null);
  const isClosingRef = useRef(false);

  // Pre-calculated glass shards
  const shards = useMemo(() => generateGlassShards(), [isActive]);

  // Reset and initialize on active trigger
  useEffect(() => {
    if (!isActive) return;

    setPhase('break');
    setCrackCount(0);
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

    const nextCrack = crackCount + 1;

    if (nextCrack === 1) {
      // Impact 1: First stress fracture
      sound.playGlassCrack(1);
      navigator.vibrate?.(25);
      setCrackCount(1);

      // Micro-recoil spring animation
      gsap.fromTo(blockCardRef.current,
        { scale: 0.96, rotate: (Math.random() - 0.5) * 1.5 },
        { scale: 1, rotate: 0, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' }
      );
    } else if (nextCrack === 2) {
      // Impact 2: Deep spiderweb crack propagation
      sound.playGlassCrack(2);
      navigator.vibrate?.([30, 40]);
      setCrackCount(2);

      // Violent vibration shake
      gsap.timeline()
        .to(blockCardRef.current, { scale: 0.94, duration: 0.06 })
        .to(blockCardRef.current, { x: -4, rotate: -1.2, duration: 0.05 })
        .to(blockCardRef.current, { x: 4, rotate: 1.2, duration: 0.05 })
        .to(blockCardRef.current, { x: -2, duration: 0.04 })
        .to(blockCardRef.current, { scale: 1, x: 0, rotate: 0, duration: 0.35, ease: 'elastic.out(1, 0.3)' });
    } else if (nextCrack >= 3) {
      // Impact 3: FINAL IMPACT -> SHATTER INTO GLASS FRAGMENTS!
      sound.playGlassShatter();
      navigator.vibrate?.([40, 60, 80]);
      setPhase('shattering');

      // Animate 24 flying glass fragments outward
      if (shardsContainerRef.current) {
        const shardElements = shardsContainerRef.current.children;
        Array.from(shardElements).forEach((el, idx) => {
          const shardData = shards[idx];
          if (!shardData) return;

          gsap.to(el, {
            x: shardData.vx,
            y: shardData.vy,
            rotation: shardData.rotation,
            opacity: 0,
            scale: 0.4,
            duration: 0.75,
            delay: shardData.delay,
            ease: 'power3.out'
          });
        });
      }

      // Smooth transition to full-screen Zen Mode
      setTimeout(() => {
        setPhase('zen');
        // Start soothing chord soundscape with rain/ocean texture
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
              Break it open.
            </h2>
          </div>

          {/* Centered Physical Block Container */}
          <div className="relative flex items-center justify-center">
            {/* The Solid Physical Block (Before Shatter) */}
            {phase === 'break' && (
              <div
                ref={blockCardRef}
                onClick={handleBlockClick}
                className="relative group w-[285px] sm:w-[325px] rounded-[22px] p-6 cursor-pointer select-none transition-transform duration-150 active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(145deg, rgba(35, 40, 50, 0.85) 0%, rgba(18, 20, 26, 0.92) 100%)',
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
                    style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.9))' }}
                  >
                    {/* Primary Fracture Lines (Crack 1) */}
                    <path
                      d="M 160 100 L 140 70 L 105 50 L 60 30 M 160 100 L 185 75 L 230 65 L 290 40 M 160 100 L 150 140 L 120 170 M 160 100 L 195 130 L 250 175"
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="bevel"
                      opacity="0.95"
                    />
                    <path
                      d="M 160 100 L 140 70 L 105 50 L 60 30 M 160 100 L 185 75 L 230 65 L 290 40 M 160 100 L 150 140 L 120 170 M 160 100 L 195 130 L 250 175"
                      stroke="#67e8f9"
                      strokeWidth="1.2"
                      fill="none"
                      strokeLinecap="round"
                      opacity="0.8"
                    />

                    {/* Secondary Spiderweb Fractures (Crack 2) */}
                    {crackCount >= 2 && (
                      <>
                        <path
                          d="M 140 70 L 110 95 L 70 110 M 185 75 L 205 105 L 270 120 M 150 140 L 180 155 M 105 50 L 125 20 M 230 65 L 245 25 M 120 170 L 90 190 M 250 175 L 285 190"
                          stroke="#ffffff"
                          strokeWidth="1.8"
                          fill="none"
                          strokeLinecap="round"
                          opacity="0.9"
                        />
                        <path
                          d="M 130 80 Q 160 60 190 80 Q 210 110 180 140 Q 140 145 125 110 Z"
                          stroke="#ffffff"
                          strokeWidth="1.2"
                          strokeDasharray="4 2"
                          fill="none"
                          opacity="0.6"
                        />
                        <circle cx="160" cy="100" r="3" fill="#ffffff" filter="blur(1px)" />
                      </>
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
              >
                {shards.map((shard) => (
                  <div
                    key={shard.id}
                    className="absolute inset-0 rounded-[20px]"
                    style={{
                      clipPath: shard.clipPath,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(35,40,50,0.8) 100%)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 0 10px rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                ))}

                {/* Central Burst Flash */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-white blur-xl animate-ping opacity-75" />
                </div>
              </div>
            )}
          </div>

          {/* Understated Instruction Hint */}
          {phase === 'break' && (
            <p className="mt-7 text-xs font-mono uppercase tracking-[0.2em] text-white/45 animate-pulse">
              {crackCount === 0 && '[ Tap the Block to break ]'}
              {crackCount === 1 && '[ Tap again ]'}
              {crackCount === 2 && '[ One more hit to break! ]'}
            </p>
          )}
        </div>
      )}

      {/* ========================================================
          PHASE 3: FULL-SCREEN CINEMATIC ZEN MODE (POST-SHATTER)
          ======================================================== */}
      {phase === 'zen' && (
        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center animate-modal-in">
          {/* Looping 4K Cinematic Scene Background */}
          {currentScene.type === 'video' ? (
            <video
              key={currentScene.id}
              src={currentScene.url}
              poster={currentScene.poster}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ease-in-out"
            />
          ) : (
            <div 
              key={currentScene.id}
              className="absolute inset-0 w-full h-full bg-cover bg-center pointer-events-none transition-opacity duration-1000 ease-in-out"
              style={{
                backgroundImage: `url(${currentScene.url})`,
                animation: 'kenburns 15s ease-out infinite alternate'
              }}
            />
          )}

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
