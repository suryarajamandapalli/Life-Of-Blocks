const API_KEY = 'Jh6o24lj5So9QGiDgvzKeXSO6kASPCZk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q || 'nature';
  const page = req.query.page || '1';
  const sorting = req.query.sorting || 'toplist';

  const wallhavenUrl = `https://wallhaven.cc/api/v1/search?q=${encodeURIComponent(query)}&apikey=${API_KEY}&atleast=1920x1080&sorting=${sorting}&page=${page}`;

  try {
    const response = await fetch(wallhavenUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-API-Key': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Wallhaven returned status ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Wallhaven proxy fetch error:', err.message);
    return res.status(500).json({ error: 'Wallhaven fetch failed', details: err.message });
  }
}
