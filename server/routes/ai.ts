import { Router, Request, Response } from 'express';
import { recognizeWithKimi, searchWithKimi } from '../lib/aiService';

export const aiRouter = Router();

aiRouter.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, places } = req.body;
    if (!query || !places) {
      return res.status(400).json({ error: 'Missing query or places' });
    }

    const result = await searchWithKimi(query, places);
    res.json(result);
  } catch (error) {
    console.error('AI search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

aiRouter.post('/recognize', async (req: Request, res: Response) => {
  try {
    const { text, image } = req.body;
    if (!text && !image) {
      return res.status(400).json({ error: 'Must provide text or image' });
    }

    const result = await recognizeWithKimi(text, image);
    res.json(result);
  } catch (error) {
    console.error('AI recognize error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
