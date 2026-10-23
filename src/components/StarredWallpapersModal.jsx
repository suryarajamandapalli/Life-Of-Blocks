import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Trash2, 
  Check, 
  Sparkles, 
  Search, 
  Loader2, 
  Flame,
  CheckCircle2,
  BookmarkPlus
} from 'lucide-react';
import { 
  getStarredWallpapers, 
  removeStarredWallpaper, 
  toggleStarWallpaper, 
  isWallpaperStarred, 
  subscribeWallpaperStore 
} from '../services/wallpaperStore';
import { searchWallhavenWallpapers } from '../services/wallpapers';

const POPULAR_TAGS = [
  { label: 'Anime', query: 'anime aesthetic' },
  { label: 'Space', query: 'space 4k nebula galaxy' },
  { label: 'Nature', query: 'nature mountains landscape lake' },
  { label: 'Cyberpunk', query: 'cyberpunk neon city' },
  { label: 'Cars', query: 'retro sports car supercar' },
  { label: 'Minimal', query: 'minimalist dark clean 4k' },
  { label: 'Sunset', query: 'sunset horizon golden hour' }
];

export default function StarredWallpapersModal({
  isOpen,
  onClose,
  activeWallpaper,
  onSelectWallpaper
}) {
  const [activeTab, setActiveTab] = useState('starred'); // 'starred' | 'search'
  const [starredList, setStarredList] = useState(() => getStarredWallpapers());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const update = () => setStarredList(getStarredWallpapers());
    update();
    const unsub = subscribeWallpaperStore(update);
    return () => unsub();
  }, [isOpen]);

  // Initial popular search when opening the search tab for the first time
  useEffect(() => {
    if (isOpen && activeTab === 'search' && !hasSearched && searchResults.length === 0) {
      handlePerformSearch('anime aesthetic');
    }
  }, [isOpen, activeTab, hasSearched]);

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

  const handlePerformSearch = async (queryText) => {
    const q = (queryText !== undefined ? queryText : searchQuery).trim() || 'anime';
    setIsSearching(true);
    setHasSearched(true);

    try {
      const results = await searchWallhavenWallpapers(q);
      setSearchResults(results || []);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    setSelectedTag('');
    handlePerformSearch();
  };

  const handleSelectTag = (tag) => {
    setSelectedTag(tag.label);
    setSearchQuery(tag.label);
    handlePerformSearch(tag.query);
  };

  const handleRemove = (e, wallpaperId) => {
    e.stopPropagation();
    removeStarredWallpaper(wallpaperId);
  };

  const handleToggleStarFromResult = (e, item) => {
    e.stopPropagation();
    toggleStarWallpaper(item);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xl animate-modal-in select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl max-h-[90vh] rounded-[24px] border border-white/20 shadow-2xl flex flex-col overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(18, 22, 30, 0.96) 0%, rgba(10, 12, 16, 0.98) 100%)',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar with Dual Navigation Tabs */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Tab 1: Starred Wallpapers */}
            <button
              onClick={() => setActiveTab('starred')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'starred'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${activeTab === 'starred' ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>Starred</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                activeTab === 'starred' ? 'bg-amber-400/30 text-amber-200' : 'bg-white/10 text-white/50'
              }`}>
                {starredList.length}
              </span>
            </button>

            {/* Tab 2: Wallhaven 4K Search */}
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-sky-400/20 text-sky-300 border border-sky-400/40 shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search Wallhaven</span>
              <span className="hidden sm:inline-block text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono">
                4K Live
              </span>
            </button>
          </div>

          <button
            onClick={onClose}
            title="Close (Esc)"
            className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2]" />
          </button>
        </div>

        {/* ================= TAB 1: STARRED WALLPAPERS ================= */}
        {activeTab === 'starred' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
            {starredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mb-3">
                  <Star className="w-6 h-6 text-amber-400/70" />
                </div>
                <p className="text-sm font-medium text-white/80 mb-1">
                  No starred wallpapers yet
                </p>
                <p className="text-xs text-white/40 max-w-xs mb-4">
                  Switch to the "Search Wallhaven" tab above to find and star wallpapers you love!
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-semibold text-sky-300 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Explore Wallhaven 4K
                </button>
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

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
                        <span className="text-[11px] font-semibold text-white drop-shadow truncate">
                          {isActive ? 'Current Wallpaper' : 'Click to Set as Wallpaper'}
                        </span>
                      </div>

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
        )}

        {/* ================= TAB 2: SEARCH WALLHAVEN 4K ================= */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar flex flex-col">
            {/* Search Input Bar */}
            <form onSubmit={handleSubmitSearch} className="relative mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 4K Wallpapers (e.g. anime, space, cyberpunk, nature)..."
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/15 focus:border-sky-400/60 text-xs sm:text-sm text-white placeholder-white/40 focus:outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-50 text-black font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-md cursor-pointer flex-shrink-0"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Search</span>
              </button>
            </form>

            {/* Quick Inspiration Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 custom-scrollbar">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 flex items-center gap-1 mr-1 flex-shrink-0">
                <Flame className="w-3 h-3 text-amber-400" /> Tags:
              </span>
              {POPULAR_TAGS.map((tag) => {
                const isSelected = selectedTag === tag.label;
                return (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-400/30 text-sky-200 border border-sky-400/50 shadow-sm'
                        : 'bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>

            {/* Search Content Results Grid */}
            <div className="flex-1 mt-1">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="w-8 h-8 text-sky-400 animate-spin mb-3" />
                  <p className="text-xs font-medium text-white/70">
                    Fetching 4K wallpapers from Wallhaven...
                  </p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <p className="text-sm font-medium text-white/70 mb-1">
                    No wallpapers found
                  </p>
                  <p className="text-xs text-white/40">
                    Try another search term like "space", "anime", "neon", or tap a tag above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchResults.map((item) => {
                    const isActive = activeWallpaper?.id === item.id;
                    const isStarred = isWallpaperStarred(item.id);

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
                            : 'border-white/10 hover:border-white/40 hover:scale-[1.02] shadow-md'
                        }`}
                      >
                        <img 
                          src={item.thumb || item.url} 
                          alt="" 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />

                        {/* Hover Overlay with Set Wallpaper Action */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-2.5">
                          <span className="text-[11px] font-semibold text-white drop-shadow truncate flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-sky-400" />
                            {isActive ? 'Current Wallpaper' : 'Set as Wallpaper'}
                          </span>
                        </div>

                        {/* Active Checkmark Badge */}
                        {isActive && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Active</span>
                          </div>
                        )}

                        {/* Quick Star Favorite Toggle Button */}
                        <button
                          onClick={(e) => handleToggleStarFromResult(e, item)}
                          title={isStarred ? "Remove from starred" : "Star this wallpaper"}
                          className={`absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-md transition-all cursor-pointer shadow-lg active:scale-90 ${
                            isStarred
                              ? 'bg-amber-400/90 text-black'
                              : 'bg-black/60 hover:bg-black/80 text-white/70 hover:text-amber-300 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-black' : ''}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
