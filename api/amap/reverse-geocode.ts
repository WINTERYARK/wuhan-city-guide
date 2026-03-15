import { reverseGeocode } from '../../server/lib/amapService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { location, extensions, radius, poitype } = req.query || {};
    if (!location) {
      return res.status(400).json({ error: 'Missing location parameter (lng,lat)' });
    }
    const data = await reverseGeocode(
      String(location),
      extensions ? String(extensions) : undefined,
      radius ? String(radius) : undefined,
      poitype ? String(poitype) : undefined
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
