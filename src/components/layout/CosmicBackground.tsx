import React, { useEffect, useRef } from 'react';
import { GlassIntensity } from '../../types';

interface CosmicBackgroundProps {
  wallpaper: string;
  customWallpaper?: string;
  animatedParticles?: boolean;
  particleSpeed?: number;
  glassIntensity?: GlassIntensity;
}

export const WALLPAPER_PRESETS: Record<
  string,
  {
    name: string;
    description: string;
    bgGradient: string;
    nebulaGlow1: string;
    nebulaGlow2: string;
    accentTone: string;
  }
> = {
  'nebula-aurora': {
    name: 'Nebula Aurora',
    description: 'Deep cosmic cyan and teal stardust clouds',
    bgGradient: 'radial-gradient(ellipse at 50% 20%, #0c1a2e 0%, #050b14 60%, #020408 100%)',
    nebulaGlow1: 'radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
    nebulaGlow2: 'radial-gradient(circle at 20% 80%, rgba(56, 189, 248, 0.12) 0%, transparent 60%)',
    accentTone: '#38bdf8',
  },
  'deep-cosmos': {
    name: 'Deep Cosmos',
    description: 'Stellar violet & indigo interstellar clusters',
    bgGradient: 'radial-gradient(ellipse at 40% 30%, #150f28 0%, #070512 60%, #020106 100%)',
    nebulaGlow1: 'radial-gradient(circle at 75% 30%, rgba(168, 85, 247, 0.16) 0%, transparent 60%)',
    nebulaGlow2: 'radial-gradient(circle at 25% 70%, rgba(99, 102, 241, 0.14) 0%, transparent 60%)',
    accentTone: '#a855f7',
  },
  'supernova-core': {
    name: 'Supernova Core',
    description: 'Dark obsidian with subtle crimson & amber energy',
    bgGradient: 'radial-gradient(ellipse at 60% 40%, #1c0f14 0%, #0d0609 60%, #030102 100%)',
    nebulaGlow1: 'radial-gradient(circle at 80% 40%, rgba(244, 63, 94, 0.15) 0%, transparent 60%)',
    nebulaGlow2: 'radial-gradient(circle at 20% 60%, rgba(245, 158, 11, 0.1) 0%, transparent 60%)',
    accentTone: '#f43f5e',
  },
  'cosmic-void': {
    name: 'Cosmic Void',
    description: 'Pure minimalist deep space with crisp star points',
    bgGradient: 'radial-gradient(circle at 50% 50%, #090d16 0%, #04060a 70%, #010204 100%)',
    nebulaGlow1: 'radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.04) 0%, transparent 70%)',
    nebulaGlow2: 'radial-gradient(circle at 50% 70%, rgba(56, 189, 248, 0.06) 0%, transparent 60%)',
    accentTone: '#e2e8f0',
  },
  'emerald-galaxy': {
    name: 'Emerald Galaxy',
    description: 'Luminescent deep space aurora green',
    bgGradient: 'radial-gradient(ellipse at 50% 30%, #081d19 0%, #030d0b 60%, #010403 100%)',
    nebulaGlow1: 'radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
    nebulaGlow2: 'radial-gradient(circle at 30% 70%, rgba(20, 184, 166, 0.12) 0%, transparent 60%)',
    accentTone: '#10b981',
  },
};

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  wallpaper = 'nebula-aurora',
  customWallpaper,
  animatedParticles = true,
  particleSpeed = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const preset = WALLPAPER_PRESETS[wallpaper] || WALLPAPER_PRESETS['nebula-aurora'];

  useEffect(() => {
    if (!animatedParticles) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool: gentle stars & cosmic dust
    const PARTICLE_COUNT = Math.min(80, Math.floor((width * height) / 18000));
    interface Particle {
      x: number;
      y: number;
      size: number;
      alpha: number;
      baseAlpha: number;
      twinkleSpeed: number;
      vx: number;
      vy: number;
      color: string;
    }

    const colors = ['#ffffff', '#bae6fd', '#e0f2fe', '#ddd6fe', '#c7d2fe'];

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => {
      const baseAlpha = 0.15 + Math.random() * 0.6;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.6 + Math.random() * 1.6,
        alpha: baseAlpha,
        baseAlpha,
        twinkleSpeed: (0.005 + Math.random() * 0.015) * particleSpeed,
        vx: (Math.random() - 0.5) * 0.12 * particleSpeed,
        vy: (Math.random() - 0.5) * 0.08 * particleSpeed,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    let time = 0;
    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Subtle drift
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Twinkle
        p.alpha = p.baseAlpha + Math.sin(time * p.twinkleSpeed * 100) * 0.25;
        const currentAlpha = Math.max(0.05, Math.min(0.9, p.alpha));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.fill();

        // Subtle glow for larger particles
        if (p.size > 1.4) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = currentAlpha * 0.25;
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animatedParticles, particleSpeed]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Base Background Gradient */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-out"
        style={{
          background: preset.bgGradient,
        }}
      />

      {/* Custom Wallpaper if configured */}
      {customWallpaper && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-screen transition-opacity duration-700"
          style={{ backgroundImage: `url(${customWallpaper})` }}
        />
      )}

      {/* Atmospheric Nebula Glows */}
      <div
        className="absolute inset-0 opacity-80 mix-blend-screen transition-all duration-1000"
        style={{ background: preset.nebulaGlow1 }}
      />
      <div
        className="absolute inset-0 opacity-70 mix-blend-screen transition-all duration-1000"
        style={{ background: preset.nebulaGlow2 }}
      />

      {/* Subtle Spatial Horizon Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/50" />

      {/* Starfield Particles Canvas */}
      {animatedParticles && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
      )}
    </div>
  );
};
