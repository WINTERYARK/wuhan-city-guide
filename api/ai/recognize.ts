import { recognizeWithKimi } from '../../server/lib/aiService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { text, image } = body || {};
    if (!text && !image) {
      return res.status(400).json({ error: 'Must provide text or image' });
    }

    const result = await recognizeWithKimi(text, image);
    return res.status(200).json(result);
  } catch (error) {
    console.error('AI recognize error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
