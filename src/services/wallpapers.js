// Wallhaven Random 4K Wallpaper Engine for LIFE OF BLOCKS
// Delivers TRULY RANDOM, High-Definition 4K Wallpapers across Nature, Space, Aesthetic, Universe, Bikes, Cars, and Minimalist themes.

const API_KEY = 'Jh6o24lj5So9QGiDgvzKeXSO6kASPCZk';

// Expanded diverse 4K Wallhaven curated catalog (spanning Nature, Space, Bikes, Universe, Aesthetic)
export const WALLHAVEN_WALLPAPERS = [
  // --- NATURE & LANDSCAPES ---
  { id: 'zpvdzv', name: 'Mountain Lake Horizon', url: 'https://w.wallhaven.cc/full/zp/wallhaven-zpvdzv.jpg' },
  { id: 'vp22dm', name: 'Alpine Jagged Peaks', url: 'https://w.wallhaven.cc/full/vp/wallhaven-vp22dm.jpg' },
  { id: 'xekp6d', name: 'Golden Hour Mountain Ridge', url: 'https://w.wallhaven.cc/full/xe/wallhaven-xekp6d.jpg' },
  { id: 'd8vv8j', name: 'Nordic Sky Reflections', url: 'https://w.wallhaven.cc/full/d8/wallhaven-d8vv8j.jpg' },
  { id: '7jxw1e', name: 'Sunset Horizon Valley', url: 'https://w.wallhaven.cc/full/7j/wallhaven-7jxw1e.png' },
  { id: '1qoopg', name: 'Atmospheric Cloudscape', url: 'https://w.wallhaven.cc/full/1q/wallhaven-1qoopg.jpg' },
  { id: 'l89x52', name: 'Misty Pine Forest River', url: 'https://w.wallhaven.cc/full/l8/wallhaven-l89x52.jpg' },
  { id: '858e8k', name: 'Emerald Valley Vista', url: 'https://w.wallhaven.cc/full/85/wallhaven-858e8k.jpg' },
  { id: '9m83zk', name: 'Dramatic Stormy Ocean', url: 'https://w.wallhaven.cc/full/9m/wallhaven-9m83zk.jpg' },
  { id: 'q2e627', name: 'Autumn Birch Reflections', url: 'https://w.wallhaven.cc/full/q2/wallhaven-q2e627.jpg' },

  // --- SPACE, UNIVERSE & COSMOS ---
  { id: 'lygg6r', name: 'Cosmic Deep Space', url: 'https://w.wallhaven.cc/full/ly/wallhaven-lygg6r.jpg' },
  { id: 'qrppoq', name: 'Vibrant Galaxy Nebula', url: 'https://w.wallhaven.cc/full/qr/wallhaven-qrppoq.png' },
  { id: 'jeljgy', name: 'Starlit Celestial Vista', url: 'https://w.wallhaven.cc/full/je/wallhaven-jeljgy.jpg' },
  { id: '2166jg', name: 'Eclipse in Deep Void', url: 'https://w.wallhaven.cc/full/21/wallhaven-2166jg.png' },
  { id: 'm388m8', name: 'Orion Nebula Pillars', url: 'https://w.wallhaven.cc/full/m3/wallhaven-m388m8.jpg' },
  { id: '6do667', name: 'Interstellar Planet Ring', url: 'https://w.wallhaven.cc/full/6d/wallhaven-6do667.jpg' },
  { id: 'kwllk7', name: 'Milky Way Core 4K', url: 'https://w.wallhaven.cc/full/kw/wallhaven-kwllk7.jpg' },
  { id: 'v93395', name: 'Supernova Cosmic Blast', url: 'https://w.wallhaven.cc/full/v9/wallhaven-v93395.jpg' },

  // --- BIKES, MOTORCYCLES & SUPERCARS ---
  { id: '83kk8k', name: 'Vintage Cafe Racer Dusk', url: 'https://w.wallhaven.cc/full/83/wallhaven-83kk8k.jpg' },
  { id: 'x8ee83', name: 'Custom Bobber Motorcycle', url: 'https://w.wallhaven.cc/full/x8/wallhaven-x8ee83.jpg' },
  { id: '28666m', name: 'Retro Scrambler Trail', url: 'https://w.wallhaven.cc/full/28/wallhaven-28666m.jpg' },
  { id: 'j3mm9p', name: 'Dark Superbike Studio', url: 'https://w.wallhaven.cc/full/j3/wallhaven-j3mm9p.jpg' },
  { id: '1k33v9', name: 'Neon Cyber Supercar', url: 'https://w.wallhaven.cc/full/1k/wallhaven-1k33v9.jpg' },
  { id: '72ww9e', name: 'Classic Porsche Night Drive', url: 'https://w.wallhaven.cc/full/72/wallhaven-72ww9e.jpg' },

  // --- AESTHETIC, CYBERPUNK & ANIME ---
  { id: '458893', name: 'Neo Tokyo Rainy Alley', url: 'https://w.wallhaven.cc/full/45/wallhaven-458893.jpg' },
  { id: 'lqvvqp', name: 'Shibuya Neon Reflections', url: 'https://w.wallhaven.cc/full/lq/wallhaven-lqvvqp.jpg' },
  { id: '83qq8k', name: 'Cyberpunk Rooftop Horizon', url: 'https://w.wallhaven.cc/full/83/wallhaven-83qq8k.jpg' },
  { id: 'g7ee7q', name: 'Anime Sky Cloud Floating', url: 'https://w.wallhaven.cc/full/g7/wallhaven-g7ee7q.jpg' },
  { id: '9mxxm8', name: 'Cozy Retro Pixel Room', url: 'https://w.wallhaven.cc/full/9m/wallhaven-9mxxm8.jpg' },

  // --- MINIMALIST DARK & AMOLED ---
  { id: 'j5ll5w', name: 'Black Geometric Monolith', url: 'https://w.wallhaven.cc/full/j5/wallhaven-j5ll5w.jpg' },
  { id: 'r28881', name: 'Abstract Minimal Curves', url: 'https://w.wallhaven.cc/full/r2/wallhaven-r28881.jpg' },
  { id: 'y8ww8e', name: 'Dark Obsidian Wave', url: 'https://w.wallhaven.cc/full/y8/wallhaven-y8ww8e.jpg' },
  { id: '3zppzy', name: 'Minimal Smoke Silhouette', url: 'https://w.wallhaven.cc/full/3z/wallhaven-3zppzy.jpg' }
];

export function getRandomWallpaper() {
  const index = Math.floor(Math.random() * WALLHAVEN_WALLPAPERS.length);
  return WALLHAVEN_WALLPAPERS[index];
}

const DYNAMIC_CATEGORIES = [
  'nature mountains lake landscape',
  'space universe nebula cosmos',
  'retro motorcycle superbike',
  'supercar sports car',
  'cyberpunk neon city architecture',
  'minimalist dark clean abstract',
  'celestial galaxy night stars',
  'dramatic golden hour sunset ocean',
  'deep forest pine misty',
  'aurora borealis night sky'
];

// Blocked vulgar search terms to sanitize input
const BLOCKED_WORDS = [
  'nsfw', 'nude', 'naked', 'porn', 'sex', 'sexy', 'bikini', 'boobs', 'breasts',
  'cleavage', 'lewd', 'erotic', 'hentai', 'ecchi', 'pussy', 'dick', 'ass',
  'lingerie', 'underwear', 'waifu', 'girl', 'girls', 'woman', 'women', 'babe',
  'babes', 'hot', 'swimsuit', 'sensual', 'vulgar'
];

/**
 * Normalizes user queries by removing noise words and scrubbing vulgar/NSFW terms
 */
export function cleanWallhavenQuery(raw) {
  if (!raw) return 'nature landscape';
  let q = raw.toLowerCase()
    .replace(/\b(wallpaper|wallpapers|bg|background|backgrounds|4k|hd|8k|image|images|pic|pics|photo|photos)\b/gi, '')
    .trim();

  // Strip vulgar words from query
  for (const bad of BLOCKED_WORDS) {
    const reg = new RegExp(`\\b${bad}\\b`, 'gi');
    q = q.replace(reg, '');
  }

  q = q.trim().replace(/\s+/g, ' ');
  return q || 'nature landscape';
}

/**
 * Fetches a batch of truly random 4K Wallhaven wallpapers using a randomized seed and dynamic theme.
 * Enforces categories=100 (General only) & purity=100 (SFW only) to guarantee family-friendly content.
 */
export async function fetchLiveWallhavenWallpapers() {
  const query = DYNAMIC_CATEGORIES[Math.floor(Math.random() * DYNAMIC_CATEGORIES.length)];
  const seed = Math.random().toString(36).substring(2, 8);
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  const baseUrl = isNative ? 'https://life-of-blocks.vercel.app' : '';
  const url = `${baseUrl}/api/wallhaven/search?q=${encodeURIComponent(query)}&sorting=random&seed=${seed}&purity=100&categories=100`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wallhaven returned HTTP ${res.status}`);
    const data = await res.json();
    if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      // Exclude category 'people' and non-sfw
      const filtered = data.data.filter(item => (!item.category || item.category !== 'people') && (!item.purity || item.purity === 'sfw'));
      if (filtered.length > 0) {
        return filtered.map(item => ({
          id: item.id,
          name: `Wallhaven #${item.id}`,
          url: item.path,
          thumb: item.thumbs?.small || item.thumbs?.original || item.path,
          resolution: item.resolution
        }));
      }
    }
  } catch (err) {
    console.warn('Live Wallhaven random fetch notice:', err);
  }

  // Shuffle and return from our expanded curated catalog
  return [...WALLHAVEN_WALLPAPERS].sort(() => Math.random() - 0.5);
}

/**
 * Searches Wallhaven live for a specific keyword/query entered by the user.
 * Automatically cleans query noise, enforces SFW purity=100 & categories=100 (General only, zero people/vulgarity).
 */
export async function searchWallhavenWallpapers(query = 'nature landscape 4k', page = 1) {
  const cleanQ = cleanWallhavenQuery(query);
  const seed = Math.random().toString(36).substring(2, 8);
  const isNative = typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.();
  const baseUrl = isNative ? 'https://life-of-blocks.vercel.app' : '';

  const fetchAttempt = async (searchWord) => {
    try {
      const url = `${baseUrl}/api/wallhaven/search?q=${encodeURIComponent(searchWord)}&page=${page}&sorting=toplist&seed=${seed}&purity=100&categories=100`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      return data?.data && Array.isArray(data.data) ? data.data : [];
    } catch {
      return [];
    }
  };

  try {
    // 1. Try cleaned query
    let results = await fetchAttempt(cleanQ);

    // 2. If 0 results, try first keyword (e.g. "space" from "space nebula")
    if (results.length === 0) {
      const firstWord = cleanQ.split(' ')[0];
      if (firstWord && firstWord !== cleanQ) {
        results = await fetchAttempt(firstWord);
      }
    }

    // 3. If still 0 results, try broader safe category
    if (results.length === 0) {
      results = await fetchAttempt(query.includes('dark') ? 'dark abstract' : 'nature');
    }

    if (results.length > 0) {
      // Exclude category 'people' and non-sfw
      const filtered = results.filter(item => (!item.category || item.category !== 'people') && (!item.purity || item.purity === 'sfw'));
      if (filtered.length > 0) {
        return filtered.map(item => ({
          id: item.id,
          name: `Wallhaven #${item.id}`,
          url: item.path,
          thumb: item.thumbs?.small || item.thumbs?.original || item.path,
          resolution: item.resolution,
          category: item.category
        }));
      }
    }
  } catch (err) {
    console.warn('Search Wallhaven notice:', err);
  }

  // Fallback matching query words
  const fallbackMatch = WALLHAVEN_WALLPAPERS.filter(w => 
    w.name.toLowerCase().includes(cleanQ.toLowerCase())
  );
  return fallbackMatch.length > 0 ? fallbackMatch : [...WALLHAVEN_WALLPAPERS].sort(() => Math.random() - 0.5);
}
