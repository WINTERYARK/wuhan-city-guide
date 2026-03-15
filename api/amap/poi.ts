import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { keywords, types, city, city_limit, page, page_size, show_fields } = req.query || {};
    if (!keywords && !types) return res.status(400).json({ error: 'Must provide keywords or types' });

    const key = process.env.AMAP_WEB_KEY;
    if (!key) return res.status(500).json({ error: 'AMAP_WEB_KEY not configured' });

    const params = new URLSearchParams({
      key,
      ...(keywords ? { keywords: String(keywords) } : {}),
      ...(types ? { types: String(types) } : {}),
      ...(city ? { region: String(city) } : {}),
      city_limit: String(city_limit || (city ? 'true' : 'false')),
      show_fields: String(show_fields || 'business'),
      page_size: String(page_size || 10),
      page_num: String(page || 1),
    });
    const response = await fetch(`https://restapi.amap.com/v5/place/text?${params}`);
    return res.status(200).json(await response.json());
  } catch (error) {
    console.error('POI search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
