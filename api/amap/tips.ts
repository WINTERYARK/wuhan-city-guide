import { inputTipsSearch } from '../../server/lib/amapService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { keywords, city, citylimit, type, location, datatype } = req.query || {};
    if (!keywords) {
      return res.status(400).json({ error: 'Missing keywords parameter' });
    }

    const data = await inputTipsSearch({
      keywords: String(keywords),
      city: city ? String(city) : undefined,
      citylimit: citylimit ? String(citylimit) : undefined,
      type: type ? String(type) : undefined,
      location: location ? String(location) : undefined,
      datatype: datatype ? String(datatype) : undefined,
    });
    return res.status(200).json(data);
  } catch (error) {
    console.error('Input tips error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
