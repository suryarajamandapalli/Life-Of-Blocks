const API_KEY = 'Jh6o24lj5So9QGiDgvzKeXSO6kASPCZk';

function cleanQuery(raw) {
  if (!raw) return 'nature';
  let q = raw.toLowerCase()
    .replace(/\b(wallpaper|wallpapers|bg|background|backgrounds|4k|hd|8k|image|images|pic|pics|photo|photos)\b/gi, '')
    .trim()
    .replace(/\s+/g, ' ');
  return q || raw.trim() || 'nature';
}

async function fetchFromWallhaven(q, sorting, page, seed) {
  let url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(q)}&apikey=${API_KEY}&atleast=1920x1080&sorting=${sorting}&page=${page}&purity=100`;
  if (seed && sorting === 'random') {
    url += `&seed=${encodeURIComponent(seed)}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'X-API-Key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`Wallhaven returned status ${response.status}`);
  }

  return await response.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery = req.query.q || 'nature';
  const query = cleanQuery(rawQuery);
  const page = req.query.page || '1';
  const sorting = req.query.sorting || 'toplist';
  const seed = req.query.seed || Math.random().toString(36).substring(2, 8);

  try {
    // 1. Try cleaned query
    let data = await fetchFromWallhaven(query, sorting, page, seed);

    // 2. If 0 results, try first word of query (e.g. "dark" from "dark aesthetic")
    if (!data?.data || data.data.length === 0) {
      const firstWord = query.split(' ')[0];
      if (firstWord && firstWord !== query) {
        data = await fetchFromWallhaven(firstWord, sorting, page, seed);
      }
    }

    // 3. If still 0 results, fallback to top wallpapers
    if (!data?.data || data.data.length === 0) {
      data = await fetchFromWallhaven('toplist', 'toplist', '1', seed);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Wallhaven proxy error:', err.message);
    return res.status(500).json({ error: 'Wallhaven fetch failed', details: err.message });
  }
}
