import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { location, keywords, types, radius, page, page_size, show_fields } = req.query || {};
    if (!location) return res.status(400).json({ error: 'Missing location parameter' });

    const key = process.env.AMAP_WEB_KEY;
    if (!key) return res.status(500).json({ error: 'AMAP_WEB_KEY not configured' });

    const params = new URLSearchParams({
      key, location: String(location),
      ...(keywords ? { keywords: String(keywords) } : {}),
      ...(types ? { types: String(types) } : {}),
      radius: String(radius || 5000), sortrule: 'distance',
      show_fields: String(show_fields || 'business'),
      page_size: String(page_size || 10), page_num: String(page || 1),
    });
    const response = await fetch(`https://restapi.amap.com/v5/place/around?${params}`);
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('POI around error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
