import { geocodeAddress } from '../../server/lib/amapService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, city } = req.query || {};
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }
    const data = await geocodeAddress(String(address), city ? String(city) : undefined);
    return res.status(200).json(data);
  } catch (error) {
    console.error('Geocode error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
