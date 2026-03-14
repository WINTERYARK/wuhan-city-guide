let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    AMap: any;
    _AMapSecurityConfig: { securityJsCode: string };
  }
}

export function loadAMap(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve();
      return;
    }

    const key = import.meta.env.VITE_AMAP_JS_KEY;
    if (!key) {
      reject(new Error('Missing VITE_AMAP_JS_KEY'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Geocoder,AMap.Geolocation,AMap.PlaceSearch,AMap.AutoComplete`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AMap JS API'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface MarkerData {
  id: string;
  position: [number, number];
  name: string;
  color: string;
}

export function createColoredMarkerContent(color: string): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = `
    width: 16px; height: 16px; border-radius: 50%;
    background-color: ${color}; border: 2px solid white;
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.3s ease; cursor: pointer;
  `;
  const inner = document.createElement('div');
  inner.style.cssText = 'width: 4px; height: 4px; background: white; border-radius: 50%;';
  el.appendChild(inner);
  return el;
}

/**
 * Create an AMap.AutoComplete instance bound to an input element.
 * Based on: https://lbs.amap.com/api/javascript-api/guide/services/autocomplete
 */
export function createAutoComplete(inputId: string, city?: string): any | null {
  if (!window.AMap) return null;

  const autoComplete = new window.AMap.AutoComplete({
    input: inputId,
    city: city || '全国',
  });
  return autoComplete;
}

/**
 * Create an AMap.PlaceSearch instance.
 */
export function createPlaceSearch(city?: string): any | null {
  if (!window.AMap) return null;

  const placeSearch = new window.AMap.PlaceSearch({
    city: city || '全国',
    pageSize: 10,
  });
  return placeSearch;
}

/**
 * Geocode an address to [lat, lng] using AMap.Geocoder JS plugin.
 * Returns null if geocoding fails.
 */
export function geocodeAddress(address: string, city?: string): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    if (!window.AMap || !window.AMap.Geocoder) {
      resolve(null);
      return;
    }

    const timeout = setTimeout(() => resolve(null), 5000);

    try {
      const geocoder = new window.AMap.Geocoder({ city: city || '全国' });
      geocoder.getLocation(address, (status: string, result: any) => {
        clearTimeout(timeout);
        if (status === 'complete' && result.geocodes?.length > 0) {
          const { lng, lat } = result.geocodes[0].location;
          resolve([lat, lng]);
        } else {
          resolve(null);
        }
      });
    } catch {
      clearTimeout(timeout);
      resolve(null);
    }
  });
}
