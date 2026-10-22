import React, { useState, useEffect } from 'react';
import { X, Star, Trash2, Check, Sparkles } from 'lucide-react';
import { getStarredWallpapers, removeStarredWallpaper, subscribeWallpaperStore } from '../services/wallpaperStore';

export default function StarredWallpapersModal({
  isOpen,
  onClose,
  activeWallpaper,
  onSelectWallpaper
}) {
  const [starredList, setStarredList] = useState(() => getStarredWallpapers());

  useEffect(() => {
    if (!isOpen) return;
    const update = () => setStarredList(getStarredWallpapers());
    update();
    const unsub = subscribeWallpaperStore(update);
    return () => unsub();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRemove = (e, wallpaperId) => {
    e.stopPropagation();
    removeStarredWallpaper(wallpaperId);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-modal-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl max-h-[85vh] rounded-[24px] border border-white/20 shadow-2xl flex flex-col overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.95) 0%, rgba(10, 12, 16, 0.98) 100%)',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm sm:text-base font-semibold text-white tracking-wide">
              Starred Wallpapers
            </h3>
            <span className="ml-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/60">
              {starredList.length}
            </span>
          </div>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* Gallery Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {starredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-3">
                <Star className="w-6 h-6 text-amber-400/70" />
              </div>
              <p className="text-sm font-medium text-white/80 mb-1">
                No starred wallpapers yet
              </p>
              <p className="text-xs text-white/40 max-w-xs">
                Hover or hold the refresh button and tap the star icon to save wallpapers you love.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {starredList.map((item) => {
                const isActive = activeWallpaper?.id === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectWallpaper(item);
                      onClose();
                    }}
                    className={`group relative aspect-[16/10] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border ${
                      isActive 
                        ? 'border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg scale-[1.01]' 
                        : 'border-white/10 hover:border-white/35 hover:scale-[1.02] shadow-md'
                    }`}
                  >
                    <img 
                      src={item.url} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Subtle Gradient Scrim on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                    {/* Active Checkmark Badge */}
                    {isActive && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active</span>
                      </div>
                    )}

                    {/* Unstar / Delete Button */}
                    <button
                      onClick={(e) => handleRemove(e, item.id)}
                      title="Remove from favorites"
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-rose-500 text-white/70 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg active:scale-90"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
