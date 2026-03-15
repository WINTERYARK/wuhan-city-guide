import type { VercelRequest, VercelResponse } from '@vercel/node';

const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';
const KIMI_MODEL = 'kimi-k2.5';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, places } = req.body || {};
    if (!query || !places) {
      return res.status(400).json({ error: 'Missing query or places' });
    }

    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'KIMI_API_KEY not configured' });
    }

    const systemPrompt = `你是一个本地生活推荐助手。用户会给你一个需求和一组地点列表。
请从中推荐恰好2个最符合用户需求的地点。
你必须返回严格的 JSON 格式，不要包含任何其他文字：
{
  "recommendedIds": ["地点id1", "地点id2"],
  "reasoning": "用中文简短解释为什么推荐这两个地点"
}`;

    const userPrompt = `我的需求：${query}\n\n可选地点列表：\n${JSON.stringify(places.map((p: any) => ({ id: p.id, name: p.name, category: p.category, kind: p.kind, price: p.price, description: p.description, rating: p.rating })))}`;

    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        temperature: 1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Kimi API error:', err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    return res.status(200).json(result);
  } catch (error) {
    console.error('AI search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
