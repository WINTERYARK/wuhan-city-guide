const AMAP_BASE = 'https://restapi.amap.com/v3';
const AMAP_V5_BASE = 'https://restapi.amap.com/v5';

function getAmapKey(): string {
  const key = process.env.AMAP_WEB_KEY;
  if (!key) throw new Error('AMAP_WEB_KEY is not set');
  return key;
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AMap API error: ${err}`);
  }
  return response.json();
}

export function geocodeAddress(address: string, city?: string) {
  const params = new URLSearchParams({
    key: getAmapKey(),
    address,
    output: 'JSON',
    ...(city ? { city } : {}),
  });
  return fetchJson(`${AMAP_BASE}/geocode/geo?${params}`);
}

export function reverseGeocode(location: string, extensions?: string, radius?: string, poitype?: string) {
  const params = new URLSearchParams({
    key: getAmapKey(),
    location,
    output: 'JSON',
    extensions: extensions || 'base',
    radius: radius || '1000',
    ...(poitype ? { poitype } : {}),
  });
  return fetchJson(`${AMAP_BASE}/geocode/regeo?${params}`);
}

export function searchPoi(query: {
  keywords?: string;
  types?: string;
  city?: string;
  city_limit?: string;
  page?: string;
  page_size?: string;
  show_fields?: string;
}) {
  const params = new URLSearchParams({
    key: getAmapKey(),
    ...(query.keywords ? { keywords: query.keywords } : {}),
    ...(query.types ? { types: query.types } : {}),
    ...(query.city ? { region: query.city } : {}),
    city_limit: query.city_limit || (query.city ? 'true' : 'false'),
    show_fields: query.show_fields || 'business',
    page_size: query.page_size || '10',
    page_num: query.page || '1',
  });
  return fetchJson(`${AMAP_V5_BASE}/place/text?${params}`);
}

export function searchPoiAround(query: {
  location: string;
  keywords?: string;
  types?: string;
  radius?: string;
  page?: string;
  page_size?: string;
  show_fields?: string;
}) {
  const params = new URLSearchParams({
    key: getAmapKey(),
    location: query.location,
    ...(query.keywords ? { keywords: query.keywords } : {}),
    ...(query.types ? { types: query.types } : {}),
    radius: query.radius || '5000',
    sortrule: 'distance',
    show_fields: query.show_fields || 'business',
    page_size: query.page_size || '10',
    page_num: query.page || '1',
  });
  return fetchJson(`${AMAP_V5_BASE}/place/around?${params}`);
}

export function inputTipsSearch(query: {
  keywords: string;
  city?: string;
  citylimit?: string;
  type?: string;
  location?: string;
  datatype?: string;
}) {
  const params = new URLSearchParams({
    key: getAmapKey(),
    keywords: query.keywords,
    ...(query.city ? { city: query.city } : {}),
    ...(query.citylimit ? { citylimit: query.citylimit } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.location ? { location: query.location } : {}),
    datatype: query.datatype || 'poi',
  });
  return fetchJson(`${AMAP_BASE}/assistant/inputtips?${params}`);
}
