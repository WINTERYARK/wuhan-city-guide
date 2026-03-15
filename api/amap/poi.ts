import { searchPoi } from '../../server/lib/amapService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keywords, types, city, city_limit, page, page_size, show_fields } = req.query || {};
    if (!keywords && !types) {
      return res.status(400).json({ error: 'Must provide keywords or types' });
    }

    const data = await searchPoi({
      keywords: keywords ? String(keywords) : undefined,
      types: types ? String(types) : undefined,
      city: city ? String(city) : undefined,
      city_limit: city_limit ? String(city_limit) : undefined,
      page: page ? String(page) : undefined,
      page_size: page_size ? String(page_size) : undefined,
      show_fields: show_fields ? String(show_fields) : undefined,
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error('POI search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
