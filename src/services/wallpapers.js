// Wallhaven Random Wallpaper System for LIFE OF BLOCKS

const API_KEY = 'Jh6o24lj5So9QGiDgvzKeXSO6kASPCZk';

// Curated verified high-resolution 4K Wallhaven wallpapers (Vibrant, high clarity, not dim)
export const WALLHAVEN_WALLPAPERS = [
  {
    id: 'zpvdzv',
    name: 'Mountain Lake Horizon',
    url: 'https://w.wallhaven.cc/full/zp/wallhaven-zpvdzv.jpg'
  },
  {
    id: 'lygg6r',
    name: 'Cosmic Deep Space',
    url: 'https://w.wallhaven.cc/full/ly/wallhaven-lygg6r.jpg'
  },
  {
    id: 'vp22dm',
    name: 'Alpine Jagged Peaks',
    url: 'https://w.wallhaven.cc/full/vp/wallhaven-vp22dm.jpg'
  },
  {
    id: 'qrppoq',
    name: 'Vibrant Galaxy Nebula',
    url: 'https://w.wallhaven.cc/full/qr/wallhaven-qrppoq.png'
  },
  {
    id: 'xekp6d',
    name: 'Golden Hour Mountain Ridge',
    url: 'https://w.wallhaven.cc/full/xe/wallhaven-xekp6d.jpg'
  },
  {
    id: 'd8vv8j',
    name: 'Nordic Sky Reflections',
    url: 'https://w.wallhaven.cc/full/d8/wallhaven-d8vv8j.jpg'
  },
  {
    id: '7jxw1e',
    name: 'Sunset Horizon Valley',
    url: 'https://w.wallhaven.cc/full/7j/wallhaven-7jxw1e.png'
  },
  {
    id: 'jeljgy',
    name: 'Starlit Celestial Vista',
    url: 'https://w.wallhaven.cc/full/je/wallhaven-jeljgy.jpg'
  },
  {
    id: '2166jg',
    name: 'Eclipse in Deep Void',
    url: 'https://w.wallhaven.cc/full/21/wallhaven-2166jg.png'
  },
  {
    id: '1qoopg',
    name: 'Atmospheric Cloudscape',
    url: 'https://w.wallhaven.cc/full/1q/wallhaven-1qoopg.jpg'
  }
];

export function getRandomWallpaper() {
  const index = Math.floor(Math.random() * WALLHAVEN_WALLPAPERS.length);
  return WALLHAVEN_WALLPAPERS[index];
}

// Fetch live random vibrant 4K wallpapers from Wallhaven API
export async function fetchLiveWallhavenWallpapers() {
  const queries = [
    'nature',
    'space',
    'mountains',
    'galaxy nebula',
    'landscape',
    'retro motorcycle',
    'minimal architecture',
    'aurora'
  ];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const sortModes = ['toplist', 'random'];
  const sort = sortModes[Math.floor(Math.random() * sortModes.length)];

  const url = `/api/wallhaven/search?q=${encodeURIComponent(q)}&apikey=${API_KEY}&atleast=1920x1080&sorting=${sort}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wallhaven API returned ${res.status}`);
    const data = await res.json();
    if (data && data.data && data.data.length > 0) {
      return data.data.map(item => ({
        id: item.id,
        name: `Wallhaven #${item.id}`,
        url: item.path
      }));
    }
  } catch (err) {
    console.warn('Could not fetch live Wallhaven wallpapers, using curated Wallhaven list:', err);
  }
  return WALLHAVEN_WALLPAPERS;
}
