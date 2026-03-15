import { searchPoiAround } from '../../../server/lib/amapService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { location, keywords, types, radius, page, page_size, show_fields } = req.query || {};
    if (!location) {
      return res.status(400).json({ error: 'Missing location parameter (lng,lat)' });
    }

    const data = await searchPoiAround({
      location: String(location),
      keywords: keywords ? String(keywords) : undefined,
      types: types ? String(types) : undefined,
      radius: radius ? String(radius) : undefined,
      page: page ? String(page) : undefined,
      page_size: page_size ? String(page_size) : undefined,
      show_fields: show_fields ? String(show_fields) : undefined,
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error('POI around search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
