import { Router, Request, Response } from 'express';

export const amapRouter = Router();

const AMAP_BASE = 'https://restapi.amap.com/v3';
const AMAP_V5_BASE = 'https://restapi.amap.com/v5';

function getAmapKey(): string {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) throw new Error('AMAP_WEB_KEY is not set');
  return key;
}

// 地理编码: 结构化地址 → 经纬度
// https://restapi.amap.com/v3/geocode/geo
amapRouter.get('/geocode', async (req: Request, res: Response) => {
  try {
    const { address, city } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }

    const params = new URLSearchParams({
      key: getAmapKey(),
      address: String(address),
      output: 'JSON',
      ...(city ? { city: String(city) } : {}),
    });

    const response = await fetch(`${AMAP_BASE}/geocode/geo?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 逆地理编码: 经纬度 → 结构化地址 + 附近 POI
// https://restapi.amap.com/v3/geocode/regeo
amapRouter.get('/reverse-geocode', async (req: Request, res: Response) => {
  try {
    const { location, extensions, radius, poitype } = req.query;
    if (!location) {
      return res.status(400).json({ error: 'Missing location parameter (lng,lat)' });
    }

    const params = new URLSearchParams({
      key: getAmapKey(),
      location: String(location),
      output: 'JSON',
      extensions: String(extensions || 'base'),
      radius: String(radius || 1000),
      ...(poitype ? { poitype: String(poitype) } : {}),
    });

    const response = await fetch(`${AMAP_BASE}/geocode/regeo?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 搜索POI 2.0 - 关键字搜索
// https://restapi.amap.com/v5/place/text
amapRouter.get('/poi', async (req: Request, res: Response) => {
  try {
    const { keywords, types, city, city_limit, page, page_size, show_fields } = req.query;
    if (!keywords && !types) {
      return res.status(400).json({ error: 'Must provide keywords or types' });
    }

    const params = new URLSearchParams({
      key: getAmapKey(),
      ...(keywords ? { keywords: String(keywords) } : {}),
      ...(types ? { types: String(types) } : {}),
      ...(city ? { region: String(city) } : {}),
      city_limit: String(city_limit || (city ? 'true' : 'false')),
      show_fields: String(show_fields || 'business'),
      page_size: String(page_size || 10),
      page_num: String(page || 1),
    });

    const response = await fetch(`${AMAP_V5_BASE}/place/text?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('POI search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 搜索POI 2.0 - 周边搜索
// https://restapi.amap.com/v5/place/around
amapRouter.get('/poi/around', async (req: Request, res: Response) => {
  try {
    const { location, keywords, types, radius, page, page_size, show_fields } = req.query;
    if (!location) {
      return res.status(400).json({ error: 'Missing location parameter (lng,lat)' });
    }

    const params = new URLSearchParams({
      key: getAmapKey(),
      location: String(location),
      ...(keywords ? { keywords: String(keywords) } : {}),
      ...(types ? { types: String(types) } : {}),
      radius: String(radius || 5000),
      sortrule: 'distance',
      show_fields: String(show_fields || 'business'),
      page_size: String(page_size || 10),
      page_num: String(page || 1),
    });

    const response = await fetch(`${AMAP_V5_BASE}/place/around?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('POI around search error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 输入提示 (Web Service API)
// https://restapi.amap.com/v3/assistant/inputtips
// 注意: 此 API 使用 citylimit (非 city_limit), 与 POI 2.0 命名不同
amapRouter.get('/tips', async (req: Request, res: Response) => {
  try {
    const { keywords, city, citylimit, type, location, datatype } = req.query;
    if (!keywords) {
      return res.status(400).json({ error: 'Missing keywords parameter' });
    }

    const params = new URLSearchParams({
      key: getAmapKey(),
      keywords: String(keywords),
      ...(city ? { city: String(city) } : {}),
      ...(citylimit ? { citylimit: String(citylimit) } : {}),
      ...(type ? { type: String(type) } : {}),
      ...(location ? { location: String(location) } : {}),
      datatype: String(datatype || 'poi'),
    });

    const response = await fetch(`${AMAP_BASE}/assistant/inputtips?${params}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Input tips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
