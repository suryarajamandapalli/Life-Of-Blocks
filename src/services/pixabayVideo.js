// Pixabay Video API Service for Zen Backgrounds
// Key: 26332564-15fd8bb2e3c1f1053c57de01b
// Categories: 4K Rain, Ocean, Beach, Space & Universe

const PIXABAY_API_KEY = '26332564-15fd8bb2e3c1f1053c57de01b';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours per Pixabay API terms

// Verified, direct Pixabay CDN 4K / 1080p Royalty-Free Videos (Zero Watermarks)
export const CURATED_PIXABAY_VIDEOS = [
  // --- 🌧️ RAIN ---
  {
    id: 'pixabay_rain_nature_42420',
    title: 'Rain on Forest Leaves',
    category: 'rain',
    url: 'https://cdn.pixabay.com/video/2020/06/17/42420-431511648_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2020/06/17/42420-431511648_large.jpg',
    width: 1920,
    height: 1080
  },
  {
    id: 'pixabay_rain_window_11722',
    title: 'Peaceful Rain on Window Glass',
    category: 'rain',
    url: 'https://cdn.pixabay.com/video/2017/08/30/11722-231759069_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2017/08/30/11722-231759069_large.jpg',
    width: 1920,
    height: 1080
  },
  {
    id: 'pixabay_rain_water_17013',
    title: 'Rain Falling on Water Surface',
    category: 'rain',
    url: 'https://cdn.pixabay.com/video/2018/07/02/17013-278400948_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2018/07/02/17013-278400948_large.jpg',
    width: 1920,
    height: 1080
  },
  {
    id: 'pixabay_rain_4k_37088',
    title: '4K Rainfall in Spring Nature',
    category: 'rain',
    url: 'https://cdn.pixabay.com/video/2020/04/24/37088-413229662_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2020/04/24/37088-413229662_large.jpg',
    width: 3840,
    height: 2160
  },

  // --- 🌊 OCEAN ---
  {
    id: 'pixabay_ocean_4k_140111',
    title: '4K Aerial Blue Ocean Waves',
    category: 'ocean',
    url: 'https://cdn.pixabay.com/video/2022/11/22/140111-774507949_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2022/11/22/140111-774507949_large.jpg',
    width: 3840,
    height: 2160
  },
  {
    id: 'pixabay_ocean_4k_36609',
    title: '4K Cinematic Ocean Swell',
    category: 'ocean',
    url: 'https://cdn.pixabay.com/video/2020/04/19/36609-411342371_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2020/04/19/36609-411342371_large.jpg',
    width: 4096,
    height: 2160
  },
  {
    id: 'pixabay_ocean_waves_283533',
    title: 'Crashing Turquoise Ocean Surf',
    category: 'ocean',
    url: 'https://cdn.pixabay.com/video/2025/06/03/283533_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2025/06/03/283533_large.jpg',
    width: 1920,
    height: 1080
  },

  // --- 🏖️ BEACH ---
  {
    id: 'pixabay_beach_4k_263305',
    title: '4K Calm Tropical Beach Coast',
    category: 'beach',
    url: 'https://cdn.pixabay.com/video/2025/03/08/263305_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2025/03/08/263305_large.jpg',
    width: 3840,
    height: 2160
  },
  {
    id: 'pixabay_beach_4k_218714',
    title: '4K Sunset Beach Rolling Waters',
    category: 'beach',
    url: 'https://cdn.pixabay.com/video/2024/06/29/218714_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2024/06/29/218714_large.jpg',
    width: 3840,
    height: 2160
  },
  {
    id: 'pixabay_beach_4k_23838',
    title: '4K Clear Shoreline Shore',
    category: 'beach',
    url: 'https://cdn.pixabay.com/video/2019/05/21/23838-337674789_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2019/05/21/23838-337674789_large.jpg',
    width: 3840,
    height: 2160
  },

  // --- 🌌 SPACE & UNIVERSE ---
  {
    id: 'pixabay_space_4k_264488',
    title: '4K Deep Space Cosmic Galaxy',
    category: 'space',
    url: 'https://cdn.pixabay.com/video/2025/03/13/264488_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2025/03/13/264488_large.jpg',
    width: 3840,
    height: 2160
  },
  {
    id: 'pixabay_universe_4k_204738',
    title: '4K Stardust Nebula Universe',
    category: 'universe',
    url: 'https://cdn.pixabay.com/video/2024/03/19/204738-925166445_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2024/03/19/204738-925166445_large.jpg',
    width: 3840,
    height: 2160
  },
  {
    id: 'pixabay_space_stars_55990',
    title: 'Glowing Cosmic Stars Nebula',
    category: 'space',
    url: 'https://cdn.pixabay.com/video/2020/11/09/55990-478348906_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2020/11/09/55990-478348906_large.jpg',
    width: 1920,
    height: 1080
  },
  {
    id: 'pixabay_universe_galaxy_13100',
    title: 'Infinite Starry Universe',
    category: 'universe',
    url: 'https://cdn.pixabay.com/video/2017/11/28/13100-245530611_large.mp4',
    poster: 'https://cdn.pixabay.com/video/2017/11/28/13100-245530611_large.jpg',
    width: 1920,
    height: 1080
  }
];

class PixabayVideoService {
  constructor() {
    this.memoryCache = new Map();
  }

  // Fetch videos for a specific search query with 24h caching
  async fetchCategoryVideos(query = 'rain') {
    const cacheKey = `lob_pixabay_vids_${query.toLowerCase()}`;

    // 1. Check in-memory cache
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // 2. Check localStorage cache
    try {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && Array.isArray(parsed.videos) && parsed.videos.length > 0) {
          this.memoryCache.set(cacheKey, parsed.videos);
          return parsed.videos;
        }
      }
    } catch {}

    // 3. Fetch from Pixabay API
    try {
      const endpoint = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&video_type=film&order=popular&per_page=12`;
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Pixabay API status: ${res.status}`);

      const data = await res.json();
      const hits = data.hits || [];

      const videos = hits
        .map(h => {
          const v = (h.videos?.large?.url && h.videos.large.size > 0) ? h.videos.large : h.videos?.medium;
          if (!v || !v.url) return null;
          return {
            id: `pixabay_${h.id}`,
            title: h.tags?.split(',').slice(0, 2).join(', ').trim() || query,
            category: query,
            width: v.width || 1920,
            height: v.height || 1080,
            url: v.url,
            poster: v.thumbnail || h.videos?.medium?.thumbnail || ''
          };
        })
        .filter(Boolean)
        .filter(v => v.width > v.height); // landscape only

      if (videos.length > 0) {
        this.memoryCache.set(cacheKey, videos);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), videos }));
        } catch {}
        return videos;
      }
    } catch (err) {
      console.warn('Pixabay API fetch notice (using curated library):', err);
    }

    // 4. Fallback to curated library filtered by category
    const fallbacks = CURATED_PIXABAY_VIDEOS.filter(v => 
      v.category.toLowerCase().includes(query.toLowerCase()) || 
      query.toLowerCase().includes(v.category.toLowerCase())
    );
    return fallbacks.length > 0 ? fallbacks : CURATED_PIXABAY_VIDEOS;
  }

  // Get all available 4K/HD videos (Curated + dynamic cache)
  async getAllZenVideos() {
    const categories = ['rain', 'ocean', 'beach', 'space', 'universe'];
    const results = await Promise.allSettled(categories.map(c => this.fetchCategoryVideos(c)));
    
    const combined = [];
    results.forEach(res => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        combined.push(...res.value);
      }
    });

    if (combined.length === 0) return CURATED_PIXABAY_VIDEOS;

    // Deduplicate by URL
    const seen = new Set();
    const unique = [];
    [...combined, ...CURATED_PIXABAY_VIDEOS].forEach(v => {
      if (!seen.has(v.url)) {
        seen.add(v.url);
        unique.push(v);
      }
    });
    return unique;
  }
}

export const pixabayService = new PixabayVideoService();
