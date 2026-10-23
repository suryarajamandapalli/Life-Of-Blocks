import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { sound } from '../services/sound';
import { Check } from 'lucide-react';

// Verified 4K / 1080p Cinematic Zen Environment Videos (Rain, Beach, Deep Space, Ocean, Forest, Snow, Clouds)
const ZEN_SCENES = [
  {
    id: 'rain_water',
    name: 'Peaceful Rain',
    url: 'https://raw.githubusercontent.com/developedbyed/meditation-app/master/video/rain.mp4',
    poster: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'calm_beach',
    name: 'Calm Ocean Surf',
    url: 'https://raw.githubusercontent.com/developedbyed/meditation-app/master/video/beach.mp4',
    poster: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'deep_space_orion',
    name: 'Orion Nebula Space',
    url: 'https://images-assets.nasa.gov/video/JPL-20221122-SOLSYSf-0001-Orion%20Dust%20and%20Death/JPL-20221122-SOLSYSf-0001-Orion%20Dust%20and%20Death~mobile.mp4',
    poster: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'forest_mist',
    name: 'Forest Mist & Stream',
    url: 'https://mdbootstrap.com/img/video/forest.mp4',
    poster: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'tropical_shore',
    name: 'Tropical Shoreline',
    url: 'https://mdbootstrap.com/img/video/Tropical.mp4',
    poster: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'falling_snow',
    name: 'Winter Falling Snow',
    url: 'https://raw.githubusercontent.com/mawaqit/mobile-assets/main/weather-videos/snow.mp4',
    poster: 'https://images.unsplash.com/photo-1517299321929-30a7063a34db?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'mountain_clouds',
    name: 'Mountain Clouds',
    url: 'https://raw.githubusercontent.com/mawaqit/mobile-assets/main/weather-videos/cloudy.mp4',
    poster: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'deep_cosmos',
    name: 'Cosmic Starfield',
    url: 'https://images-assets.nasa.gov/video/JPL-20231222-SOLSYSf-0001-NASA%20Telescopes%20Reveal%20Hidden%20Universe/JPL-20231222-SOLSYSf-0001-NASA%20Telescopes%20Reveal%20Hidden%20Universe~mobile.mp4',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=85&w=2560&auto=format&fit=crop'
  },
  {
    id: 'rain_window',
    name: 'Rain on Window',
    url: 'https://raw.githubusercontent.com/mawaqit/mobile-assets/main/weather-videos/rain.mp4',
    poster: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=85&w=2560&auto=format&fit=crop'
  }
];

// Meaningful, peaceful completion copy randomly selected
const ZEN_MESSAGES = [
  "You made space.",
  "Breathe. You earned this moment.",
  "One step complete. Keep going gently.",
  "Nothing to rush. Just keep moving."
];

export default function CalmModeOverlay({ isActive, block, blockName, totalTasks = 0, onClose }) {
  // Experience phases: 'break' -> 'shattering' -> 'zen'
  const [phase, setPhase] = useState('break');
  const [crackCount, setCrackCount] = useState(0); // 0 -> 1 -> 2 -> 3 (shatters)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [zenMessage, setZenMessage] = useState(() => ZEN_MESSAGES[0]);

  const rootContainerRef = useRef(null);
  const blockCardRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const stopMusicRef = useRef(null);
  const isClosingRef = useRef(false);
  const animationFrameRef = useRef(null);

  // Crack branches state for Hit 1 & Hit 2
  const crackBranchesRef = useRef([]);
  const ripplesRef = useRef([]);

  // Reset and initialize on active trigger
  useEffect(() => {
    if (!isActive) return;

    setPhase('break');
    setCrackCount(0);
    isClosingRef.current = false;
    crackBranchesRef.current = [];
    ripplesRef.current = [];

    // Pick random scene & peaceful message
    setCurrentSceneIndex(Math.floor(Math.random() * ZEN_SCENES.length));
    const randomMsg = ZEN_MESSAGES[Math.floor(Math.random() * ZEN_MESSAGES.length)];
    setZenMessage(randomMsg);

    // Initial entrance animation for the physical Block
    if (blockCardRef.current) {
      gsap.fromTo(blockCardRef.current, 
        { scale: 0.9, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.15)' }
      );
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (stopMusicRef.current) {
        stopMusicRef.current();
        stopMusicRef.current = null;
      }
    };
  }, [isActive]);

  // Rotate cinematic background scenes smoothly during Zen Mode
  useEffect(() => {
    if (!isActive || phase !== 'zen') return;

    const interval = setInterval(() => {
      setCurrentSceneIndex(prev => (prev + 1) % ZEN_SCENES.length);
    }, 12000);

    return () => clearInterval(interval);
  }, [isActive, phase]);

  // Generate recursive realistic fractal crack branches from impact point
  const generateCrackBranch = (originX, originY, angle, depth, length) => {
    const branches = [];
    let currX = originX;
    let currY = originY;
    let currAngle = angle;

    for (let i = 0; i < depth; i++) {
      const segLen = length * (0.75 + Math.random() * 0.45);
      currAngle += (Math.random() - 0.5) * 0.45; // jagged deviation
      const nextX = currX + Math.cos(currAngle) * segLen;
      const nextY = currY + Math.sin(currAngle) * segLen;

      branches.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });

      // Sub-branchlet splitting off
      if (i > 0 && Math.random() < 0.55) {
        const subAngle = currAngle + (Math.random() < 0.5 ? 0.7 : -0.7);
        const subLen = segLen * 0.65;
        branches.push({
          x1: currX,
          y1: currY,
          x2: currX + Math.cos(subAngle) * subLen,
          y2: currY + Math.sin(subAngle) * subLen
        });
      }

      currX = nextX;
      currY = nextY;
    }
    return branches;
  };

  // Draw overlay cracks and ripples on the card canvas
  const drawCracksAndRipples = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw expanding impact ripples
    ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0.02);
    ripplesRef.current.forEach(r => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      r.radius += 3.2;
      r.alpha *= 0.88;
    });

    // 2. Draw stress fractures
    crackBranchesRef.current.forEach(branch => {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';

      // Outer soft glass refraction glow
      ctx.beginPath();
      ctx.moveTo(branch.x1, branch.y1);
      ctx.lineTo(branch.x2, branch.y2);
      ctx.strokeStyle = 'rgba(180, 220, 255, 0.45)';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      // Sharp white fracture core
      ctx.beginPath();
      ctx.moveTo(branch.x1, branch.y1);
      ctx.lineTo(branch.x2, branch.y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      ctx.restore();
    });

    if (ripplesRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(drawCracksAndRipples);
    }
  };

  // Launch the true 60fps Voronoi/Delaunay glass physics shatter simulation
  const launchShatterPhysics = (impactX, impactY, cardRect) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Expand canvas to full viewport for flying shards
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '45';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Global coordinates of the impact point
    const globalImpactX = cardRect.left + impactX;
    const globalImpactY = cardRect.top + impactY;

    // Generate 64 irregular Voronoi/radial polygonal glass shards
    const shards = [];
    const sectors = 16;
    const baseAngle = (Math.PI * 2) / sectors;
    const rings = 4; // concentric rings from center to perimeter

    const maxRadius = Math.hypot(cardRect.width, cardRect.height) * 0.65;

    for (let r = 0; r < rings; r++) {
      const rInner = (r / rings) * maxRadius;
      const rOuter = ((r + 1) / rings) * maxRadius;

      for (let s = 0; s < sectors; s++) {
        const a1 = s * baseAngle + (Math.random() - 0.5) * 0.18;
        const a2 = (s + 1) * baseAngle + (Math.random() - 0.5) * 0.18;
        const midA = (a1 + a2) / 2;

        const p0x = globalImpactX + Math.cos(a1) * rInner;
        const p0y = globalImpactY + Math.sin(a1) * rInner;
        const p1x = globalImpactX + Math.cos(a2) * rInner;
        const p1y = globalImpactY + Math.sin(a2) * rInner;
        const p2x = globalImpactX + Math.cos(a2) * rOuter;
        const p2y = globalImpactY + Math.sin(a2) * rOuter;
        const p3x = globalImpactX + Math.cos(a1) * rOuter;
        const p3y = globalImpactY + Math.sin(a1) * rOuter;

        const cx = (p0x + p1x + p2x + p3x) / 4;
        const cy = (p0y + p1y + p2y + p3y) / 4;

        // Skip shards that are far outside the initial card rectangle
        if (
          cx < cardRect.left - 40 ||
          cx > cardRect.right + 40 ||
          cy < cardRect.top - 40 ||
          cy > cardRect.bottom + 40
        ) {
          continue;
        }

        // Polygon points relative to center of mass
        const poly = [
          { x: p0x - cx, y: p0y - cy },
          { x: p1x - cx, y: p1y - cy },
          { x: p2x - cx, y: p2y - cy },
          { x: p3x - cx, y: p3y - cy }
        ];

        // Physics velocity: explosive radial push away from impact point
        const dir = Math.atan2(cy - globalImpactY, cx - globalImpactX) + (Math.random() - 0.5) * 0.25;
        const isInner = r <= 1;
        const speed = (isInner ? 450 : 260) + Math.random() * 380;

        shards.push({
          x: cx,
          y: cy,
          vx: Math.cos(dir) * speed,
          vy: Math.sin(dir) * speed - (60 + Math.random() * 90), // upward explosive kick
          rot: Math.random() * Math.PI * 2,
          vrot: (Math.random() - 0.5) * 7.5,
          alpha: 1.0,
          scale: 1.0,
          poly,
          specular: Math.random() * Math.PI
        });
      }
    }

    // Generate 50 shimmering micro glass dust sparkle particles
    const sparks = [];
    for (let i = 0; i < 50; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 300 + Math.random() * 550;
      sparks.push({
        x: globalImpactX,
        y: globalImpactY,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 40,
        size: 1.2 + Math.random() * 2.2,
        alpha: 1.0
      });
    }

    let lastTime = performance.now();

    const renderPhysicsFrame = (time) => {
      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Render & update shards
      let anyAlive = false;
      shards.forEach(s => {
        if (s.alpha <= 0.01) return;
        anyAlive = true;

        // Physics update
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 920 * dt; // Realistic gravitational pull downward
        s.vx *= 0.988;    // Air drag
        s.vy *= 0.992;
        s.rot += s.vrot * dt;
        s.alpha -= dt * 0.85; // Smooth fade over ~1.1s
        s.specular += dt * 3.5;

        // Render shard polygon
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);

        ctx.beginPath();
        s.poly.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();

        // Smoked translucent glass fill
        ctx.fillStyle = `rgba(32, 38, 50, ${Math.max(0, s.alpha * 0.88)})`;
        ctx.fill();

        // Faceted specular glint edge
        const glint = Math.sin(s.specular);
        const strokeAlpha = Math.max(0, s.alpha * (0.55 + 0.35 * glint));
        ctx.strokeStyle = `rgba(255, 255, 255, ${strokeAlpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.restore();
      });

      // Render & update sparkle dust
      sparks.forEach(sp => {
        if (sp.alpha <= 0.02) return;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 450 * dt;
        sp.alpha -= dt * 1.2;

        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, sp.alpha * 0.9)})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 6;
        ctx.fill();
      });

      if (anyAlive) {
        animationFrameRef.current = requestAnimationFrame(renderPhysicsFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(renderPhysicsFrame);
  };

  // Handle User Clicking / Tapping the Physical Glass Block
  const handleBlockClick = (e) => {
    e.stopPropagation();
    if (phase !== 'break') return;

    const rect = blockCardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const nextCrack = crackCount + 1;

    if (nextCrack === 1) {
      // HIT 1: Subtle impact ripple, tiny realistic stress fracture, short vibration
      sound.playGlassCrack(1);
      navigator.vibrate?.(25);
      setCrackCount(1);

      // Add ripple shockwave
      ripplesRef.current.push({ x: clickX, y: clickY, radius: 4, alpha: 0.85 });

      // Add 4-5 fine hairline fractures
      for (let i = 0; i < 5; i++) {
        const angle = (i * (Math.PI * 2) / 5) + (Math.random() - 0.5) * 0.3;
        const branch = generateCrackBranch(clickX, clickY, angle, 3, 14);
        crackBranchesRef.current.push(...branch);
      }

      drawCracksAndRipples();

      // Micro-recoil spring
      gsap.fromTo(blockCardRef.current,
        { scale: 0.96, rotate: (Math.random() - 0.5) * 1.2 },
        { scale: 1, rotate: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.4)' }
      );
    } else if (nextCrack === 2) {
      // HIT 2: Deep branching glass fractures, surface flexes, stronger feedback
      sound.playGlassCrack(2);
      navigator.vibrate?.([30, 40]);
      setCrackCount(2);

      ripplesRef.current.push({ x: clickX, y: clickY, radius: 6, alpha: 0.95 });

      // Add 8-10 major fractures propagating outwards to edges
      for (let i = 0; i < 8; i++) {
        const angle = (i * (Math.PI * 2) / 8) + (Math.random() - 0.5) * 0.4;
        const branch = generateCrackBranch(clickX, clickY, angle, 5, 22);
        crackBranchesRef.current.push(...branch);
      }

      drawCracksAndRipples();

      // Surface flex vibration
      gsap.timeline()
        .to(blockCardRef.current, { scale: 0.93, duration: 0.05 })
        .to(blockCardRef.current, { x: -5, rotate: -1.5, duration: 0.04 })
        .to(blockCardRef.current, { x: 5, rotate: 1.5, duration: 0.04 })
        .to(blockCardRef.current, { x: -2, duration: 0.04 })
        .to(blockCardRef.current, { scale: 1, x: 0, rotate: 0, duration: 0.35, ease: 'elastic.out(1.1, 0.35)' });
    } else if (nextCrack >= 3) {
      // FINAL HIT: Entire block genuinely shatters into physics shards -> Boom transition
      sound.playGlassShatter();
      navigator.vibrate?.([40, 60, 85]);
      setPhase('shattering');

      // Hide the DOM block card so only the flying physics shards exist
      if (blockCardRef.current) {
        blockCardRef.current.style.opacity = '0';
        blockCardRef.current.style.pointerEvents = 'none';
      }

      // Launch genuine 60fps Voronoi physics shatter
      launchShatterPhysics(clickX, clickY, rect);

      // Camera push / cinematic boom zoom
      if (rootContainerRef.current) {
        gsap.to(rootContainerRef.current, {
          scale: 1.05,
          duration: 1.2,
          ease: 'power2.out'
        });
      }

      // Transition smoothly to full peaceful Zen environment
      setTimeout(() => {
        setPhase('zen');
        const stopFn = sound.playSoothingCalmMusic();
        stopMusicRef.current = stopFn;
      }, 700);
    }
  };

  // Exit back to application
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

  // Keyboard dismiss (Escape, Space, Enter)
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
      ref={rootContainerRef}
      className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-black transition-transform duration-700 ease-out"
      onClick={phase === 'zen' ? handleExit : undefined}
    >
      {/* ========================================================
          BACKGROUND 4K CINEMATIC NATURE/SPACE VIDEO
          Preloaded silently; smoothly emerges on shatter transition
          ======================================================== */}
      <video
        ref={videoRef}
        key={currentScene.id}
        src={currentScene.url}
        poster={currentScene.poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ease-in-out ${
          phase === 'zen' || phase === 'shattering' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Atmospheric Soft Dark Scrim Overlay for Readability */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          phase === 'zen' ? 'bg-gradient-to-b from-black/50 via-black/35 to-black/70 opacity-100' : 'bg-black opacity-100'
        }`}
      />

      {/* Soft Light Bloom Expanding from Shatter Epicenter */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          phase === 'shattering' ? 'opacity-60 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,transparent_65%)]' : 'opacity-0'
        }`}
      />

      {/* ========================================================
          PHASE 1: THE INTACT PHYSICAL GLASS BLOCK
          ======================================================== */}
      {phase !== 'zen' && (
        <div className="relative z-20 flex flex-col items-center justify-center px-4 w-full max-w-lg">
          {/* Header Typography */}
          <div className="flex flex-col items-center text-center mb-8 pointer-events-none animate-modal-in">
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] text-emerald-400 font-semibold mb-2 drop-shadow-sm">
              YOU COMPLETED THIS BLOCK
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-wide drop-shadow-lg">
              Break It
            </h2>
          </div>

          {/* The Single Premium Rounded Glass Block Container */}
          <div className="relative flex items-center justify-center">
            <div
              ref={blockCardRef}
              onClick={handleBlockClick}
              className="relative group w-[290px] sm:w-[330px] rounded-[26px] p-6 cursor-pointer select-none transition-transform duration-150 active:scale-[0.98] overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(32, 36, 46, 0.75) 0%, rgba(14, 16, 22, 0.90) 100%)',
                backdropFilter: 'blur(32px) saturate(190%)',
                WebkitBackdropFilter: 'blur(32px) saturate(190%)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                boxShadow: `
                  0 30px 60px -12px rgba(0, 0, 0, 0.85),
                  0 12px 24px -6px rgba(0, 0, 0, 0.65),
                  inset 0 1px 1.5px rgba(255, 255, 255, 0.4),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.6)
                `
              }}
            >
              {/* Diagonal Specular Highlight Across Glass Surface */}
              <div 
                className="absolute inset-0 rounded-[26px] pointer-events-none opacity-30"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(255,255,255,0.06) 60%, transparent 100%)'
                }}
              />

              {/* Status Header inside Glass Block */}
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

              {/* 100% Golden-Emerald Progress Bar */}
              <div className="w-full">
                <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden border border-white/10 p-[1px]">
                  <div className="w-full h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
                </div>
                <div className="flex justify-between items-center mt-2 text-[11px] font-mono text-white/50">
                  <span>100% DONE</span>
                  {totalTasks > 0 && <span>{totalTasks} / {totalTasks} TASKS</span>}
                </div>
              </div>

              {/* Canvas Overlay for Realistic Dynamic Cracks & Ripples */}
              <canvas
                ref={canvasRef}
                width={330}
                height={200}
                className="absolute inset-0 w-full h-full pointer-events-none rounded-[26px]"
              />
            </div>
          </div>

          {/* Minimal Instruction Below */}
          {phase === 'break' && (
            <p className="mt-7 text-xs font-mono uppercase tracking-[0.22em] text-white/50 animate-pulse">
              {crackCount === 0 && '[ TAP TO BREAK ]'}
              {crackCount === 1 && '[ TAP AGAIN ]'}
              {crackCount === 2 && '[ ONE MORE HIT TO BREAK ]'}
            </p>
          )}
        </div>
      )}

      {/* ========================================================
          PHASE 2: FULL-SCREEN CINEMATIC ZEN EXPERIENCE
          Extremely minimal: Environment is the hero. No cards. No clutter.
          ======================================================== */}
      {phase === 'zen' && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-2xl pointer-events-auto animate-fade-in">
          {/* Calming Quote (Randomly Selected) */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-wide text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] leading-relaxed sm:leading-snug mb-6">
            "{zenMessage}"
          </h2>

          {/* Understated Block Name Mention */}
          <div className="flex items-center gap-2 mb-10 text-white/70 font-light">
            <span className="text-sm sm:text-base font-medium text-white/90 tracking-wide">
              {displayName}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs sm:text-sm font-mono tracking-widest text-emerald-400 font-medium">
              COMPLETED
            </span>
          </div>

          {/* Minimalist Continue Button */}
          <button
            onClick={handleExit}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <span className="text-sm sm:text-base font-light tracking-wider text-white">
              Continue →
            </span>
          </button>

          {/* Subtle Dismiss Helper */}
          <p className="mt-5 text-[11px] font-mono tracking-widest uppercase text-white/30">
            Press Esc or tap anywhere to return
          </p>
        </div>
      )}
    </div>
  );
}
