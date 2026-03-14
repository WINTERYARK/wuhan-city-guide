import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Place, CATEGORY_COLORS, CATEGORY_LABELS } from '../data';
import { loadAMap, createColoredMarkerContent } from '../lib/amap';
import { Star, LocateFixed, Expand, Heart, Maximize2, X, Building2, Trash2 } from 'lucide-react';

interface MapViewProps {
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string | null) => void;
  onToggleFavorite: (id: string) => void;
  onDeletePlace: (id: string) => void;
}

const CITIES: { name: string; position: [number, number] }[] = [
  { name: '武汉', position: [30.5928, 114.3055] },
  { name: '上海', position: [31.2304, 121.4737] },
  { name: '北京', position: [39.9042, 116.4074] },
  { name: '广州', position: [23.1291, 113.2644] },
  { name: '深圳', position: [22.5431, 114.0579] },
];

export default function MapView({ places, selectedPlaceId, onSelectPlace, onToggleFavorite, onDeletePlace }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showCityMenu, setShowCityMenu] = useState(false);
  const [expandedPlaceId, setExpandedPlaceId] = useState<string | null>(null);
  const expandedPlace = expandedPlaceId ? places.find(p => p.id === expandedPlaceId) : null;

  useEffect(() => {
    let mounted = true;

    loadAMap().then(() => {
      if (!mounted || !containerRef.current || mapRef.current) return;

      const map = new window.AMap.Map(containerRef.current, {
        zoom: 12,
        center: [114.3055, 30.5928],
        resizeEnable: true,
        viewMode: '2D',
      });

      mapRef.current = map;
      infoWindowRef.current = new window.AMap.InfoWindow({
        isCustom: true,
        autoMove: true,
        offset: new window.AMap.Pixel(0, -20),
      });

      setMapReady(true);
    }).catch(err => {
      console.error('Failed to load AMap:', err);
    });

    return () => {
      mounted = false;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, []);

  const buildInfoContent = useCallback((place: Place): string => {
    const color = CATEGORY_COLORS[place.category];
    const label = CATEGORY_LABELS[place.category];
    return `
      <div style="background:white;border-radius:12px;padding:12px 16px;min-width:220px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-family:system-ui,-apple-system,sans-serif;">
        <div style="display:flex;align-items:start;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <h3 style="margin:0;font-size:16px;font-weight:700;color:#111;">${place.name}</h3>
          <button onclick="document.dispatchEvent(new CustomEvent('map-expand',{detail:'${place.id}'}))"
            style="background:#eff6ff;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:4px;color:#f59e0b;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style="font-weight:700;font-size:13px;">${place.rating.toFixed(1)}</span>
          </div>
          <span style="font-size:13px;font-weight:500;color:#374151;">${place.price}</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
          <span style="background:${color};color:white;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:500;">${label}</span>
          ${place.kind ? `<span style="background:#f3f4f6;color:#374151;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:500;">${place.kind}</span>` : ''}
        </div>
        <div style="background:#f9fafb;border-radius:8px;padding:8px;display:none;" class="md-only">
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${place.description}</p>
        </div>
      </div>
    `;
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const existingIds = new Set(places.map(p => p.id));

    markersRef.current.forEach((marker, id) => {
      if (!existingIds.has(id)) {
        map.remove(marker);
        markersRef.current.delete(id);
      }
    });

    places.forEach(place => {
      const color = CATEGORY_COLORS[place.category];
      const existing = markersRef.current.get(place.id);

      if (existing) {
        existing.setPosition(new window.AMap.LngLat(place.position[1], place.position[0]));
        return;
      }

      const marker = new window.AMap.Marker({
        position: new window.AMap.LngLat(place.position[1], place.position[0]),
        content: createColoredMarkerContent(color),
        offset: new window.AMap.Pixel(-8, -8),
        extData: { id: place.id },
      });

      marker.on('click', () => {
        onSelectPlace(place.id);
      });

      map.add(marker);
      markersRef.current.set(place.id, marker);
    });
  }, [mapReady, places, onSelectPlace]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;

    if (!selectedPlaceId) {
      infoWindow.close();
      return;
    }

    const place = places.find(p => p.id === selectedPlaceId);
    if (!place) return;

    infoWindow.setContent(buildInfoContent(place));
    infoWindow.open(map, new window.AMap.LngLat(place.position[1], place.position[0]));

    if (window.innerWidth >= 768) {
      map.setZoomAndCenter(17, new window.AMap.LngLat(place.position[1], place.position[0]), false, 800);
    }
  }, [mapReady, selectedPlaceId, places, buildInfoContent]);

  useEffect(() => {
    const handler = (e: Event) => {
      const placeId = (e as CustomEvent).detail;
      setExpandedPlaceId(placeId);
    };
    document.addEventListener('map-expand', handler);
    return () => document.removeEventListener('map-expand', handler);
  }, []);

  const handleCurrentLocation = () => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setZoomAndCenter(15, new window.AMap.LngLat(pos.coords.longitude, pos.coords.latitude), false, 800);
        },
        () => {
          alert('无法获取当前位置，请检查浏览器权限设置。');
        }
      );
    } else {
      alert('您的浏览器不支持地理位置功能。');
    }
  };

  const handleResetView = () => {
    if (!mapRef.current) return;
    onSelectPlace(null);
    mapRef.current.setZoomAndCenter(12, new window.AMap.LngLat(114.3055, 30.5928), false, 800);
  };

  const handleCitySwitch = (position: [number, number]) => {
    if (!mapRef.current) return;
    mapRef.current.setZoomAndCenter(12, new window.AMap.LngLat(position[1], position[0]), false, 800);
    setShowCityMenu(false);
  };

  return (
    <div className="h-full w-full relative z-0">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map Controls */}
      <style>{`
        .map-controls {
          bottom: calc(var(--drawer-height, 50vh) + 16px);
        }
        @media (min-width: 768px) {
          .map-controls {
            bottom: 24px;
          }
        }
        .sidebar-maximized .map-controls {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>

      <div className="map-controls absolute right-4 md:right-6 z-[1000] flex flex-col gap-2 transition-all duration-300 ease-in-out">
        <button
          onClick={handleCurrentLocation}
          className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
          title="移动到当前位置"
        >
          <LocateFixed size={20} />
        </button>
        <button
          onClick={handleResetView}
          className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
          title="还原初始地图大小"
        >
          <Expand size={20} />
        </button>
      </div>

      <div className="map-controls absolute left-4 md:left-6 z-[1000] flex flex-col gap-2 transition-all duration-300 ease-in-out">
        <div className="relative">
          <button
            onClick={() => setShowCityMenu(!showCityMenu)}
            className="bg-white p-2.5 rounded-xl shadow-md border border-gray-100 text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-colors"
            title="切换城市"
          >
            <Building2 size={20} />
          </button>

          {showCityMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="py-1">
                {CITIES.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => handleCitySwitch(city.position)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Expanded Place Modal */}
      {expandedPlace && (
        <div className="md:hidden absolute inset-0 z-[2000] bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="relative h-40 bg-gray-200 shrink-0">
              <img
                src={`https://picsum.photos/seed/${expandedPlace.id}/400/200`}
                alt={expandedPlace.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (window.confirm('确定要删除这个地点吗？')) {
                      onDeletePlace(expandedPlace.id);
                      setExpandedPlaceId(null);
                    }
                  }}
                  className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                  title="删除"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={() => setExpandedPlaceId(null)}
                  className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <h2 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{expandedPlace.name}</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm">{expandedPlace.rating.toFixed(1)}</span>
                  </div>
                  <span>•</span>
                  <span className="text-sm font-medium">{expandedPlace.price}</span>
                </div>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="flex flex-wrap gap-2 mb-4">
                <div
                  className="inline-block px-3 py-1 rounded-lg text-xs font-medium text-white shadow-sm"
                  style={{ backgroundColor: CATEGORY_COLORS[expandedPlace.category] }}
                >
                  {CATEGORY_LABELS[expandedPlace.category]}
                </div>
                {expandedPlace.kind && (
                  <div className="inline-block px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 shadow-sm">
                    {expandedPlace.kind}
                  </div>
                )}
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">简介</h4>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  {expandedPlace.description}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 shrink-0">
              <button
                onClick={() => onToggleFavorite(expandedPlace.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${
                  expandedPlace.isFavorite
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Heart size={18} className={expandedPlace.isFavorite ? "fill-current" : ""} />
                {expandedPlace.isFavorite ? '已收藏' : '加入收藏'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
