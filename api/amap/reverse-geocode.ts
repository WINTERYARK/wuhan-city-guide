import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { location, extensions, radius, poitype } = req.query || {};
    if (!location) return res.status(400).json({ error: 'Missing location parameter' });

    const key = process.env.AMAP_WEB_KEY;
    if (!key) return res.status(500).json({ error: 'AMAP_WEB_KEY not configured' });

    const params = new URLSearchParams({
      key, location: String(location), output: 'JSON',
      extensions: String(extensions || 'base'), radius: String(radius || 1000),
      ...(poitype ? { poitype: String(poitype) } : {}),
    });
    const response = await fetch(`https://restapi.amap.com/v3/geocode/regeo?${params}`);
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
