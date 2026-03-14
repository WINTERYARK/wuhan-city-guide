const API_BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export interface AiSearchResult {
  recommendedIds: string[];
  reasoning: string;
}

export interface AiRecognizeResult {
  name?: string | null;
  rating?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  category?: string | null;
  kind?: string | null;
  description?: string | null;
  city?: string | null;
  needsPoiEnrichment?: boolean;
  confidence?: number | null;
}

export function aiSearch(query: string, places: any[]): Promise<AiSearchResult> {
  return request('/ai/search', {
    method: 'POST',
    body: JSON.stringify({ query, places }),
  });
}

export function aiRecognize(text: string, image?: string): Promise<AiRecognizeResult> {
  return request('/ai/recognize', {
    method: 'POST',
    body: JSON.stringify({ text, image }),
  });
}

// 地理编码: 结构化地址 → 经纬度
export interface GeocodeResult {
  status: string;
  count: string;
  geocodes: Array<{
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    number: string;
    adcode: string;
    location: string;
    level: string;
  }>;
}

export function geocode(address: string, city?: string): Promise<GeocodeResult> {
  const params = new URLSearchParams({ address, ...(city ? { city } : {}) });
  return request(`/amap/geocode?${params}`);
}

// 逆地理编码: 经纬度 → 结构化地址
export interface ReverseGeocodeResult {
  status: string;
  regeocode: {
    formatted_address: string;
    addressComponent: {
      province: string;
      city: string;
      district: string;
      township: string;
    };
  };
}

export function reverseGeocode(lng: number, lat: number, extensions?: string): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    location: `${lng},${lat}`,
    ...(extensions ? { extensions } : {}),
  });
  return request(`/amap/reverse-geocode?${params}`);
}

// 搜索POI 2.0 - 关键字搜索
export interface PoiItem {
  id: string;
  name: string;
  location: string;
  type: string;
  typecode: string;
  pname: string;
  cityname: string;
  adname: string;
  address: string;
  business?: {
    rating?: string;
    cost?: string;
    tel?: string;
    tag?: string;
    business_area?: string;
  };
}

export interface PoiSearchResult {
  status: string;
  count: string;
  pois: PoiItem[];
}

export function poiSearch(keywords: string, city?: string): Promise<PoiSearchResult> {
  const params = new URLSearchParams({
    keywords,
    ...(city ? { city } : {}),
    show_fields: 'business',
  });
  return request(`/amap/poi?${params}`);
}

// 输入提示
// https://lbs.amap.com/api/webservice/guide/api-advanced/inputtips
export interface InputTip {
  id: string;
  name: string;
  district: string;
  adcode: string;
  location: string;
  address: string;
}

export interface InputTipsResult {
  status: string;
  count: string;
  tips: InputTip[];
}

export function inputTips(
  keywords: string,
  options?: { city?: string; citylimit?: boolean; type?: string; location?: string; datatype?: string }
): Promise<InputTipsResult> {
  const params = new URLSearchParams({
    keywords,
    ...(options?.city ? { city: options.city } : {}),
    ...(options?.citylimit ? { citylimit: 'true' } : {}),
    ...(options?.type ? { type: options.type } : {}),
    ...(options?.location ? { location: options.location } : {}),
    ...(options?.datatype ? { datatype: options.datatype } : {}),
  });
  return request(`/amap/tips?${params}`);
}
