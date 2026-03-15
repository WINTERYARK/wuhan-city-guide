import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { keywords, city, citylimit, type, location, datatype } = req.query || {};
    if (!keywords) return res.status(400).json({ error: 'Missing keywords parameter' });

    const key = process.env.AMAP_WEB_KEY;
    if (!key) return res.status(500).json({ error: 'AMAP_WEB_KEY not configured' });

    const params = new URLSearchParams({
      key, keywords: String(keywords),
      ...(city ? { city: String(city) } : {}),
      ...(citylimit ? { citylimit: String(citylimit) } : {}),
      ...(type ? { type: String(type) } : {}),
      ...(location ? { location: String(location) } : {}),
      datatype: String(datatype || 'poi'),
    });
    const response = await fetch(`https://restapi.amap.com/v3/assistant/inputtips?${params}`);
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('Input tips error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
