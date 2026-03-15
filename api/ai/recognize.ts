import type { VercelRequest, VercelResponse } from '@vercel/node';

const KIMI_BASE_URL = 'https://api.moonshot.cn/v1';
const KIMI_MODEL = 'kimi-k2.5';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, image } = req.body || {};
    if (!text && !image) {
      return res.status(400).json({ error: 'Must provide text or image' });
    }

    const apiKey = process.env.KIMI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'KIMI_API_KEY not configured' });
    }

    const systemPrompt = `你是一个本地生活信息提取助手。请从用户提供的文本或截图中提取出餐厅/店铺的信息。
你的职责是"提取确定信息"，不是盲目补全。
规则：
1. 优先提取最确定的字段，如店铺名称、城市、门店类型、明显可见的价格或评分。
2. 如果字段不确定，请返回 null，不要凭空猜测。
3. 如果只有店铺名称或信息明显不完整，请把 needsPoiEnrichment 设为 true。
4. confidence 取值 0-1，表示你对本次提取结果整体可信度的判断。
5. description 需要写成简短推荐文案，除了基础介绍外，尽量加入推荐菜品/招牌单品；如果无法确认推荐菜品/单品，可只写基础介绍。
6. 你必须返回严格的 JSON 格式，不要包含任何其他文字。
{
  "name": "店铺名称",
  "rating": "评分数字(1-5之间，无法确认则为null)",
  "priceMin": "最低价格(数字，无法确认则为null)",
  "priceMax": "最高价格(数字，无法确认则为null)",
  "category": "分类，必须是以下之一: clothes, malls, breakfast, lunch, dinner, coffee, bars；无法确认则为null",
  "kind": "具体类型，无法确认则为null",
  "description": "一段简短推荐文案，尽量包含推荐菜品/单品；无法确认则为null",
  "city": "城市名称，无法确认则为null",
  "needsPoiEnrichment": true,
  "confidence": 0.0
}`;

    const messages: any[] = [{ role: 'system', content: systemPrompt }];
    if (image) {
      messages.push({
        role: 'user',
        content: [
          ...(text ? [{ type: 'text', text: `用户输入内容：\n${text}` }] : []),
          { type: 'image_url', image_url: { url: image } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: `用户输入内容：\n${text}` });
    }

    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages,
        extra_body: {
          thinking: { type: 'disabled' },
        },
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
    console.error('AI recognize error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
