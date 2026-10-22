import { useState, useEffect } from 'react';
import { wallpaperSampler } from '../services/adaptiveContrast';

export function useAdaptiveContrast(elementRef, wallpaperProp) {
  const wallpaperUrl = typeof wallpaperProp === 'string' ? wallpaperProp : wallpaperProp?.url;
  const [isLight, setIsLight] = useState(false);
  const [luminance, setLuminance] = useState(40);

  useEffect(() => {
    if (wallpaperUrl) {
      wallpaperSampler.loadWallpaper(wallpaperUrl);
    }
  }, [wallpaperUrl]);

  useEffect(() => {
    const updateContrast = () => {
      if (!elementRef.current) return;
      const rect = elementRef.current.getBoundingClientRect();
      const res = wallpaperSampler.getLuminanceAtRect(rect);
      setIsLight(res.isLight);
      setLuminance(res.luminance);
    };

    // Immediate check + deferred to ensure paint completion
    updateContrast();
    const timer = setTimeout(updateContrast, 80);
    const timer2 = setTimeout(updateContrast, 300);

    const unsub = wallpaperSampler.subscribe(updateContrast);
    window.addEventListener('resize', updateContrast, { passive: true });
    window.addEventListener('scroll', updateContrast, { passive: true });

    let ro;
    if (window.ResizeObserver && elementRef.current) {
      ro = new ResizeObserver(updateContrast);
      ro.observe(elementRef.current);
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
      unsub();
      window.removeEventListener('resize', updateContrast);
      window.removeEventListener('scroll', updateContrast);
      if (ro) ro.disconnect();
    };
  }, [elementRef, wallpaperUrl]);

  return {
    isLight,
    luminance,
    // Contrast-aware styling tokens
    textColor: isLight ? 'text-zinc-950 font-medium' : 'text-white',
    textMuted: isLight ? 'text-zinc-800/80 font-normal' : 'text-white/60',
    textSubtle: isLight ? 'text-zinc-700/65' : 'text-white/40',
    textShadow: isLight
      ? 'drop-shadow-[0_1px_4px_rgba(255,255,255,0.85)]'
      : 'drop-shadow-[0_1px_6px_rgba(0,0,0,0.85)]',
    separatorBg: isLight ? 'bg-black/[0.14]' : 'bg-white/[0.08]',
    containerBg: isLight 
      ? 'bg-white/45 backdrop-blur-xl border border-black/10 shadow-lg' 
      : 'smoked-container',
    divideColor: isLight ? 'divide-black/[0.07]' : 'divide-white/[0.06]',
    rowHoverBg: isLight ? 'hover:bg-black/[0.04]' : 'hover:bg-white/[0.03]',
    rowSelectedBg: isLight ? 'bg-black/[0.06]' : 'bg-white/[0.06]'
  };
}
