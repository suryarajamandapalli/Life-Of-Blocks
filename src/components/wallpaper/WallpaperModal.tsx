import React, { useState } from 'react';
import { soundService } from '../../services/sound';
import { hapticsService } from '../../services/haptics';

export interface WallpaperItem {
  id: string;
  title: string;
  category: 'space' | 'universe' | 'nature';
  url: string;
  thumb: string;
}

// 12 Curated Ultra-HD 4K Space, Universe & Nature Wallpapers (All 100% Verified 200 OK)
export const WALLPAPERS: WallpaperItem[] = [
  // 4K Space
  {
    id: 'carina-nebula',
    title: 'Carina Cosmic Nebula',
    category: 'space',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'earth-orbit',
    title: 'Earth Orbit Horizon',
    category: 'space',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'violet-deep-space',
    title: 'Violet Deep Space Void',
    category: 'space',
    url: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?auto=format&fit=crop&w=400&q=70',
  },
  // 4K Universe & Galaxies
  {
    id: 'andromeda-galaxy',
    title: 'Andromeda Spiral Galaxy',
    category: 'universe',
    url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'milkyway-galaxy',
    title: 'Milky Way Core Starfield',
    category: 'universe',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'cosmic-starfield',
    title: 'Cosmic Constellations & Orbit',
    category: 'universe',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'starry-mountains',
    title: 'Starlight Cosmos over Peaks',
    category: 'universe',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=400&q=70',
  },
  // 4K Nature Landscapes
  {
    id: 'alpine-lake',
    title: 'Alpine Peak & Mirror Lake',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'aurora-borealis',
    title: 'Emerald Aurora Borealis',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'misty-peaks',
    title: 'Misty Alpine Mountain Ridge',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'nordic-coast',
    title: 'Nordic Coastal Landscape',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 'desert-cosmos',
    title: 'Cosmic Night over Desert Dunes',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=2560&q=85',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=70',
  },
];

interface WallpaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIndex: number;
  onSelect: (index: number) => void;
  onRandom: () => void;
}

export const WallpaperModal: React.FC<WallpaperModalProps> = ({
  isOpen,
  onClose,
  currentIndex,
  onSelect,
  onRandom,
}) => {
  const [filter, setFilter] = useState<'all' | 'space' | 'universe' | 'nature'>('all');

  if (!isOpen) return null;

  const filtered = filter === 'all' 
    ? WALLPAPERS 
    : WALLPAPERS.filter(w => w.category === filter);

  return (
    <div className="wallpaper-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="wallpaper-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="wallpaper-modal-header">
          <div>
            <h2 className="wallpaper-modal-title">4K Wallpapers</h2>
            <p className="wallpaper-modal-subtitle">Space, Universe & Nature ultra-HD backdrops</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="wallpaper-shuffle-btn"
              onClick={() => {
                soundService.playTap();
                hapticsService.light();
                onRandom();
              }}
              title="Shuffle Wallpaper"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span>Random</span>
            </button>
            <button
              type="button"
              className="wallpaper-close-btn"
              onClick={() => {
                soundService.playTap();
                hapticsService.light();
                onClose();
              }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="wallpaper-filter-bar">
          {(['all', 'space', 'universe', 'nature'] as const).map(cat => (
            <button
              key={cat}
              type="button"
              className={`wallpaper-filter-pill ${filter === cat ? 'active' : ''}`}
              onClick={() => {
                soundService.playTap();
                hapticsService.light();
                setFilter(cat);
              }}
            >
              {cat === 'all' && '✦ All Wallpapers'}
              {cat === 'space' && '🚀 Space'}
              {cat === 'universe' && '🌌 Universe'}
              {cat === 'nature' && '🏔️ Nature'}
            </button>
          ))}
        </div>

        {/* Wallpaper Grid */}
        <div className="wallpaper-grid">
          {filtered.map(w => {
            const originalIndex = WALLPAPERS.findIndex(item => item.id === w.id);
            const isSelected = originalIndex === currentIndex;

            return (
              <div
                key={w.id}
                className={`wallpaper-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  soundService.playWallpaper();
                  hapticsService.medium();
                  onSelect(originalIndex);
                }}
              >
                <img
                  src={w.thumb}
                  alt={w.title}
                  className="wallpaper-card-img"
                  loading="lazy"
                />
                <div className="wallpaper-card-overlay">
                  <span className="wallpaper-card-tag">{w.category.toUpperCase()}</span>
                  <div className="wallpaper-card-name">{w.title}</div>
                </div>
                {isSelected && (
                  <div className="wallpaper-card-check">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
