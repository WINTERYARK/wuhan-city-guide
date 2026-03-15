import { Router, Request, Response } from 'express';
import { geocodeAddress, inputTipsSearch, reverseGeocode, searchPoi, searchPoiAround } from '../lib/amapService';

export const amapRouter = Router();

// 地理编码: 结构化地址 → 经纬度
// https://restapi.amap.com/v3/geocode/geo
amapRouter.get('/geocode', async (req: Request, res: Response) => {
  try {
    const { address, city } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }

    const data = await geocodeAddress(String(address), city ? String(city) : undefined);
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

    const data = await reverseGeocode(
      String(location),
      extensions ? String(extensions) : undefined,
      radius ? String(radius) : undefined,
      poitype ? String(poitype) : undefined
    );
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

    const data = await searchPoi({
      keywords: keywords ? String(keywords) : undefined,
      types: types ? String(types) : undefined,
      city: city ? String(city) : undefined,
      city_limit: city_limit ? String(city_limit) : undefined,
      page: page ? String(page) : undefined,
      page_size: page_size ? String(page_size) : undefined,
      show_fields: show_fields ? String(show_fields) : undefined,
    });
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

    const data = await searchPoiAround({
      location: String(location),
      keywords: keywords ? String(keywords) : undefined,
      types: types ? String(types) : undefined,
      radius: radius ? String(radius) : undefined,
      page: page ? String(page) : undefined,
      page_size: page_size ? String(page_size) : undefined,
      show_fields: show_fields ? String(show_fields) : undefined,
    });
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

    const data = await inputTipsSearch({
      keywords: String(keywords),
      city: city ? String(city) : undefined,
      citylimit: citylimit ? String(citylimit) : undefined,
      type: type ? String(type) : undefined,
      location: location ? String(location) : undefined,
      datatype: datatype ? String(datatype) : undefined,
    });
    res.json(data);
  } catch (error) {
    console.error('Input tips error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
