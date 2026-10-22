// Wallhaven API Service for LIFE OF BLOCKS

const API_KEY = 'Jh6o24lj5So9QGiDgvzKeXSO6kASPCZk';
const WALLPAPER_STORAGE_KEY = 'lob_active_wallpaper';

export const WALLPAPER_CATEGORIES = [
  { id: 'space', label: 'Space 4K', query: 'space nebula deep space 4k' },
  { id: 'nature', label: 'Nature', query: 'nature mountains landscape forest lake' },
  { id: 'black', label: 'Black Minimal', query: 'black minimalist dark amoled' },
  { id: 'red', label: 'Red Aesthetic', query: 'red dark cyberpunk neon crimson' },
  { id: 'bike', label: 'Retro Bike', query: 'retro motorcycle vintage cafe racer bike' },
];

// Curated high quality presets as instant fallback
export const DEFAULT_WALLPAPERS = [
  {
    id: 'default_space',
    path: '/space-bg.webp',
    thumb: '/space-bg.webp',
    label: 'Deep Cosmic Nebula'
  },
  {
    id: 'preset_nature',
    path: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=85&w=3840&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
    label: 'Alpine Reflections'
  },
  {
    id: 'preset_black',
    path: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=85&w=3840&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop',
    label: 'Dark Obsidian'
  },
  {
    id: 'preset_red',
    path: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=85&w=3840&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
    label: 'Crimson Glow'
  },
  {
    id: 'preset_bike',
    path: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=85&w=3840&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=400&auto=format&fit=crop',
    label: 'Vintage Cafe Racer'
  }
];

export function getSavedWallpaper() {
  try {
    const saved = localStorage.getItem(WALLPAPER_STORAGE_KEY);
    return saved || DEFAULT_WALLPAPERS[0].path;
  } catch {
    return DEFAULT_WALLPAPERS[0].path;
  }
}

export function saveWallpaper(url) {
  try {
    localStorage.setItem(WALLPAPER_STORAGE_KEY, url);
  } catch (e) {
    console.warn('Failed to save wallpaper in localStorage', e);
  }
}

export async function searchWallhaven(query = 'space', page = 1) {
  // Use Vite proxy endpoint
  const url = `/api/wallhaven/search?q=${encodeURIComponent(query)}&apikey=${API_KEY}&atleast=1920x1080&sorting=toplist&page=${page}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Wallhaven API error: ${response.status}`);
    }
    const json = await response.json();
    return json.data || [];
  } catch (err) {
    console.warn('Wallhaven fetch failed, using curated fallbacks:', err);
    return [];
  }
}
