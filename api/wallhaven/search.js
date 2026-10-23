const API_KEY = 'Jh6o24lj5So9QGiDgvzKeXSO6kASPCZk';

// Negative safety operators appended to Wallhaven queries to strictly eliminate suggestive or vulgar content
const NEGATIVE_SAFETY_FILTER = '-girl -woman -female -model -bikini -swimsuit -lingerie -cleavage -sexy -nude -lewd -nsfw -sketchy -ecchi -hentai -waifu -boobs -butt -erotic -suggestive';

// Blocked vulgar search terms that will be scrubbed from queries
const BLOCKED_WORDS = [
  'nsfw', 'nude', 'naked', 'porn', 'sex', 'sexy', 'bikini', 'boobs', 'breasts',
  'cleavage', 'lewd', 'erotic', 'hentai', 'ecchi', 'pussy', 'dick', 'ass',
  'lingerie', 'underwear', 'waifu', 'girl', 'girls', 'woman', 'women', 'babe',
  'babes', 'hot', 'swimsuit', 'sensual', 'vulgar'
];

function cleanQuery(raw) {
  if (!raw) return 'nature landscape 4k';
  let q = raw.toLowerCase()
    .replace(/\b(wallpaper|wallpapers|bg|background|backgrounds|4k|hd|8k|image|images|pic|pics|photo|photos)\b/gi, '')
    .trim();

  // Strip vulgar words from query
  for (const bad of BLOCKED_WORDS) {
    const reg = new RegExp(`\\b${bad}\\b`, 'gi');
    q = q.replace(reg, '');
  }

  q = q.trim().replace(/\s+/g, ' ');
  return q || 'nature landscape 4k';
}

async function fetchFromWallhaven(q, sorting, page, seed) {
  // categories=100: Strict General category only (Landscapes, Nature, Space, Cars, Bikes, Architecture, Minimalism).
  // Categories 2 (Anime characters) and 3 (People/models) are strictly disabled (0) to prevent any NSFW, ecchi or vulgar content.
  const safeQuery = `${q} ${NEGATIVE_SAFETY_FILTER}`.trim();
  let url = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(safeQuery)}&apikey=${API_KEY}&atleast=1920x1080&sorting=${sorting}&page=${page}&purity=100&categories=100`;
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

  const json = await response.json();

  // Double filter safety check: Reject anything flagged sketchy, nsfw, or category 'people'
  if (json?.data && Array.isArray(json.data)) {
    json.data = json.data.filter(item => {
      if (item.purity && item.purity !== 'sfw') return false;
      if (item.category && item.category === 'people') return false;
      return true;
    });
  }

  return json;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery = req.query.q || 'nature landscape 4k';
  const query = cleanQuery(rawQuery);
  const page = req.query.page || '1';
  const sorting = req.query.sorting || 'toplist';
  const seed = req.query.seed || Math.random().toString(36).substring(2, 8);

  try {
    // 1. Try cleaned safe query
    let data = await fetchFromWallhaven(query, sorting, page, seed);

    // 2. If 0 results, try first word of query (e.g. "dark" from "dark aesthetic")
    if (!data?.data || data.data.length === 0) {
      const firstWord = query.split(' ')[0];
      if (firstWord && firstWord !== query) {
        data = await fetchFromWallhaven(firstWord, sorting, page, seed);
      }
    }

    // 3. If still 0 results, fallback to clean nature toplist
    if (!data?.data || data.data.length === 0) {
      data = await fetchFromWallhaven('nature', 'toplist', '1', seed);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Wallhaven proxy error:', err.message);
    return res.status(500).json({ error: 'Wallhaven fetch failed', details: err.message });
  }
}
