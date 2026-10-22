import { useState, useEffect } from 'react';
import { wallpaperSampler } from '../services/adaptiveContrast';

export function useAdaptiveContrast(elementRef, wallpaperProp) {
  const wallpaperUrl = typeof wallpaperProp === 'string' ? wallpaperProp : wallpaperProp?.url;
  const [contrastState, setContrastState] = useState({
    isLight: false,
    luminance: 40,
    isHighVariance: false
  });

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
      setContrastState(res);
    };

    // Immediate check + deferred checks after layout paint
    updateContrast();
    const timer1 = setTimeout(updateContrast, 50);
    const timer2 = setTimeout(updateContrast, 200);

    const unsub = wallpaperSampler.subscribe(updateContrast);
    window.addEventListener('resize', updateContrast, { passive: true });
    window.addEventListener('scroll', updateContrast, { passive: true });

    let ro;
    if (window.ResizeObserver && elementRef.current) {
      ro = new ResizeObserver(updateContrast);
      ro.observe(elementRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      unsub();
      window.removeEventListener('resize', updateContrast);
      window.removeEventListener('scroll', updateContrast);
      if (ro) ro.disconnect();
    };
  }, [elementRef, wallpaperUrl]);

  const isLight = contrastState.isLight;
  const isHighVariance = contrastState.isHighVariance;

  return {
    isLight,
    luminance: contrastState.luminance,
    isHighVariance,
    // Contrast-aware direct styling tokens (Strictly white #FFFFFF or dark #111111)
    textColor: isLight ? 'text-[#111111]' : 'text-[#FFFFFF]',
    textMuted: isLight ? 'text-[#111111]/75' : 'text-[#FFFFFF]/75',
    textSubtle: isLight ? 'text-[#111111]/55' : 'text-[#FFFFFF]/50',
    textShadow: isLight
      ? (isHighVariance 
          ? 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.95)] drop-shadow-[0_0_1px_rgba(255,255,255,0.7)]' 
          : 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.75)]')
      : (isHighVariance 
          ? 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] drop-shadow-[0_0_1px_rgba(0,0,0,0.7)]' 
          : 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]'),
    transitionClass: 'transition-colors duration-250 ease-out',
    checkboxBorder: isLight ? 'rgba(17, 17, 17, 0.75)' : 'rgba(255, 255, 255, 0.85)',
    checkboxBg: isLight ? 'rgba(17, 17, 17, 0.08)' : 'rgba(0, 0, 0, 0.35)'
  };
}
