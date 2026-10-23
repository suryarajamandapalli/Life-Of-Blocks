import React, { useState, useEffect, useRef } from 'react';
import { RotateCw, Lock, Unlock, Star, LayoutGrid } from 'lucide-react';
import { 
  isWallpaperLocked, 
  setWallpaperLock, 
  isWallpaperStarred, 
  toggleStarWallpaper, 
  subscribeWallpaperStore 
} from '../services/wallpaperStore';

export default function WallpaperControls({
  currentWallpaper,
  onRefresh,
  isRefreshing,
  onOpenGallery
}) {
  const [locked, setLocked] = useState(() => isWallpaperLocked());
  const [starred, setStarred] = useState(() => isWallpaperStarred(currentWallpaper?.id));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showStarGalleryHint, setShowStarGalleryHint] = useState(false);

  const containerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const longPressTimeoutRef = useRef(null);
  const isLongPressTriggeredRef = useRef(false);

  // Sync state with wallpaper store
  useEffect(() => {
    const update = () => {
      setLocked(isWallpaperLocked());
      setStarred(isWallpaperStarred(currentWallpaper?.id));
    };
    update();
    const unsub = subscribeWallpaperStore(update);
    return () => unsub();
  }, [currentWallpaper?.id]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Hover handlers with grace period
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
      setShowStarGalleryHint(false);
    }, 280);
  };

  // Long-press handlers for touch devices
  const handleTouchStart = () => {
    isLongPressTriggeredRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsMenuOpen(true);
      try {
        if (navigator.vibrate) navigator.vibrate(40);
      } catch {}
    }, 380);
  };

  const handleTouchEnd = (e) => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  // Main refresh button click
  const handleMainClick = (e) => {
    if (isLongPressTriggeredRef.current) {
      isLongPressTriggeredRef.current = false;
      return;
    }

    if (locked) {
      // If locked, opening the menu shows the user it's locked
      setIsMenuOpen(true);
      return;
    }

    onRefresh();
  };

  const handleToggleLock = (e) => {
    e.stopPropagation();
    const nextLocked = !locked;
    setLocked(nextLocked);
    setWallpaperLock(nextLocked, currentWallpaper);
  };

  const handleToggleStar = (e) => {
    e.stopPropagation();
    const nowStarred = toggleStarWallpaper(currentWallpaper);
    setStarred(nowStarred);
  };

  return (
    <div 
      className="relative flex flex-col items-center select-none"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Refresh Button */}
      <button
        onClick={handleMainClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        disabled={isRefreshing}
        title={locked ? "Wallpaper is Locked (Tap/Hold to unlock)" : "Shuffle Wallpaper (Hold for options)"}
        aria-label="Wallpaper controls"
        className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/40 hover:bg-black/65 border border-white/10 hover:border-white/30 text-white/70 hover:text-white backdrop-blur-md transition-all duration-200 flex items-center justify-center cursor-pointer shadow-lg active:scale-95"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
      </button>

      {/* Floating Options Dropdown (Revealed on Hover or Long-Press) */}
      {isMenuOpen && (
        <div 
          className="absolute top-full mt-2 z-50 flex flex-col items-center gap-1.5 p-1.5 rounded-full border border-white/15 shadow-2xl backdrop-blur-2xl animate-modal-in select-none"
          style={{
            background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.94) 0%, rgba(10, 12, 16, 0.97) 100%)',
            boxShadow: '0 16px 32px -8px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Option 1: Lock / Unlock Toggle */}
          <button
            onClick={handleToggleLock}
            title={locked ? "Locked across all devices (Click to Unlock)" : "Lock this Wallpaper (Click to Lock)"}
            aria-label="Toggle Wallpaper Lock"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
              locked 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]' 
                : 'bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10'
            }`}
          >
            {locked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Option 2: Star / Love Wallpaper Toggle (Gold Star) */}
          <button
            onClick={handleToggleStar}
            onMouseEnter={() => setShowStarGalleryHint(true)}
            title={starred ? "Starred (Loved this wallpaper)" : "Star this wallpaper"}
            aria-label="Star wallpaper"
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 ${
              starred 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.5)]' 
                : 'bg-white/[0.05] hover:bg-white/[0.12] text-white/60 hover:text-amber-300 border border-white/10'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${starred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          {/* Option 3: 3x3 Dot Grid Starred Wallpapers Gallery Icon */}
          <button
            onClick={() => {
              setIsMenuOpen(false);
              onOpenGallery();
            }}
            title="Starred Wallpapers Gallery"
            aria-label="Starred Wallpapers Gallery"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.15] text-white/70 hover:text-white border border-white/10 transition-all cursor-pointer active:scale-90 flex items-center justify-center"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
