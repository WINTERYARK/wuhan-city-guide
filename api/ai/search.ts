import { searchWithKimi } from '../../server/lib/aiService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { query, places } = body || {};
    if (!query || !places) {
      return res.status(400).json({ error: 'Missing query or places' });
    }

    const result = await searchWithKimi(query, places);
    return res.status(200).json(result);
  } catch (error) {
    console.error('AI search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
