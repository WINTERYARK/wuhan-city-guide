import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { address, city } = req.query || {};
    if (!address) return res.status(400).json({ error: 'Missing address parameter' });

    const key = process.env.AMAP_WEB_KEY;
    if (!key) return res.status(500).json({ error: 'AMAP_WEB_KEY not configured' });

    const params = new URLSearchParams({ key, address: String(address), output: 'JSON', ...(city ? { city: String(city) } : {}) });
    const response = await fetch(`https://restapi.amap.com/v3/geocode/geo?${params}`);
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('Geocode error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
