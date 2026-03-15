import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/Map';
import { Category, CATEGORY_LABELS, Place } from './data';
import { Search, Plus, X, User, LogOut, Map, Sparkles, Loader2, Heart, ChevronDown, ChevronLeft, Upload, Wand2 } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { usePlaces } from './hooks/usePlaces';
import { aiSearch, aiRecognize, geocode, inputTips, poiSearch, type AiSearchResult, type AiRecognizeResult, type PoiItem } from './services/api';
import { geocodeAddress } from './lib/amap';

export default function App() {
  const { user, loading: authLoading, username: displayName, login, register, logout } = useAuth();
  const { places: placesList, loading: placesLoading, addPlace, deletePlace, toggleFavorite } = usePlaces(user?.id);

  const [activeCategories, setActiveCategories] = useState<Set<Category>>(
    new Set(['clothes', 'malls', 'breakfast', 'meal', 'coffee', 'bakery', 'bars'])
  );
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');
  const [aiRecommendedIds, setAiRecommendedIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<'login' | 'register' | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] = useState('5');
  const [newPriceMin, setNewPriceMin] = useState('');
  const [newPriceMax, setNewPriceMax] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('coffee');
  const [newKind, setNewKind] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPoiLocation, setNewPoiLocation] = useState<[number, number] | null>(null);

  const [aiInputText, setAiInputText] = useState('');
  const [aiInputImage, setAiInputImage] = useState<File | null>(null);
  const [aiInputImageDataUrl, setAiInputImageDataUrl] = useState<string | null>(null);
  const [aiInputImagePreview, setAiInputImagePreview] = useState<string | null>(null);
  const [isAiRecognizing, setIsAiRecognizing] = useState(false);
  const [isPoiEnriching, setIsPoiEnriching] = useState(false);
  const [isAddingPlace, setIsAddingPlace] = useState(false);

  const isLoggedIn = !!user;

  const ensureMobileDrawerVisible = useCallback(() => {
    if (window.innerWidth < 768) {
      document.dispatchEvent(new CustomEvent('mobile-drawer-open'));
    }
  }, []);

  const prepareImageForAi = async (file: File): Promise<string> => {
    const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!supportedTypes.has(file.type)) {
      throw new Error('请上传 PNG、JPG 或 WEBP 格式的图片。');
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('图片读取失败，请换一张图片重试。'));
        img.src = objectUrl;
      });

      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error('浏览器暂不支持图片预处理，请稍后重试。');
      }

      context.drawImage(image, 0, 0, width, height);

      let quality = 0.82;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      const estimateBytes = (value: string) => Math.ceil((value.length - value.indexOf(',') - 1) * 0.75);

      while (estimateBytes(dataUrl) > 2_000_000 && quality > 0.5) {
        quality -= 0.08;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      return dataUrl;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const clearAddPlaceForm = useCallback(() => {
    setNewName('');
    setNewRating('5');
    setNewPriceMin('');
    setNewPriceMax('');
    setNewCategory('coffee');
    setNewKind('');
    setNewDescription('');
    setNewCity('');
    setNewPoiLocation(null);
    setAiInputText('');
    setAiInputImage(null);
    setAiInputImageDataUrl(null);
    setAiInputImagePreview(null);
    setIsAiRecognizing(false);
    setIsPoiEnriching(false);
    setIsAddingPlace(false);
  }, []);

  const parsePoiCostRange = useCallback((cost?: string) => {
    if (!cost) return null;
    const normalized = Number(cost);
    if (!Number.isFinite(normalized) || normalized <= 0) return null;
    const rounded = Math.round(normalized);
    return { min: rounded, max: rounded };
  }, []);

  const inferCategoryFromPoi = useCallback((poi: PoiItem): Category | null => {
    const content = [poi.type, poi.business?.tag, poi.name].filter(Boolean).join(' ');
    if (/面包|烘焙|吐司|可颂|蛋糕|甜品店|bread|bakery/i.test(content)) return 'bakery';
    if (/咖啡|咖啡厅|coffee/i.test(content)) return 'coffee';
    if (/酒吧|livehouse|清吧|bar/i.test(content)) return 'bars';
    if (/商场|广场|购物中心|mall/i.test(content)) return 'malls';
    if (/服装|女装|男装|服饰|买手店/i.test(content)) return 'clothes';
    if (/早餐|早茶|早点|包子|豆浆|面窝/i.test(content)) return 'breakfast';
    if (/火锅|烧烤|夜宵|晚餐|排档|烤肉|正餐|餐饮服务|美食|小吃|餐厅|料理|面馆|饭店|食堂/i.test(content)) return 'meal';
    return null;
  }, []);

  const buildPoiDescription = useCallback((poi: PoiItem) => {
    const parts = [
      poi.business?.business_area ? `${poi.business.business_area}商圈` : '',
      poi.adname ? `${poi.adname}` : '',
      poi.address ? `${poi.address}` : '',
    ].filter(Boolean);
    if (parts.length === 0) return '';
    return `位于${parts.join('，')}。`;
  }, []);

  const parsePoiLocation = useCallback((location?: string | null) => {
    if (!location) return null;
    const [lng, lat] = location.split(',').map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng] as [number, number];
  }, []);

  const pickBestPoi = useCallback((keyword: string, pois: PoiItem[]) => {
    if (pois.length === 0) return null;
    const normalizedKeyword = keyword.trim().toLowerCase();
    const scored = pois
      .map((poi) => {
        const normalizedName = poi.name.toLowerCase();
        let score = 0;
        if (normalizedName === normalizedKeyword) score += 100;
        else if (normalizedName.includes(normalizedKeyword)) score += 60;
        if (poi.business?.rating) score += Number(poi.business.rating) || 0;
        if (poi.business?.cost) score += 3;
        if (poi.address) score += 2;
        return { poi, score };
      })
      .sort((a, b) => b.score - a.score);
    return scored[0]?.poi ?? null;
  }, []);

  const handleAiRecognize = async () => {
    if (!aiInputText && !aiInputImage) return;
    setIsAiRecognizing(true);
    try {
      let imageData: string | undefined;
      if (aiInputImageDataUrl) {
        imageData = aiInputImageDataUrl;
      }

      const data: AiRecognizeResult = await aiRecognize(aiInputText, imageData);

      const recognizedName = data.name?.trim() || '';
      const recognizedCity = data.city?.trim() || '';

      setNewPoiLocation(null);
      if (recognizedName) setNewName(recognizedName);
      if (typeof data.rating === 'number') setNewRating(String(data.rating));
      if (typeof data.priceMin === 'number') setNewPriceMin(String(data.priceMin));
      if (typeof data.priceMax === 'number') setNewPriceMax(String(data.priceMax));
      if (data.category) setNewCategory(data.category as Category);
      if (data.kind) setNewKind(data.kind);
      if (data.description) setNewDescription(data.description);
      if (recognizedCity) setNewCity(recognizedCity);

      if (recognizedName) {
        setIsPoiEnriching(true);
        try {
          let matchedPoi: PoiItem | null = null;
          const poiResult = await poiSearch(recognizedName, recognizedCity || undefined);
          matchedPoi = pickBestPoi(recognizedName, poiResult.pois || []);

          if (!matchedPoi) {
            const tipsResult = await inputTips(recognizedName, {
              city: recognizedCity || undefined,
              citylimit: Boolean(recognizedCity),
              datatype: 'poi',
            });
            const bestTip = tipsResult.tips?.find((tip) => tip.name && tip.id) || tipsResult.tips?.[0];
            if (bestTip?.name) {
              const fallbackPoiResult = await poiSearch(bestTip.name, recognizedCity || undefined);
              matchedPoi = pickBestPoi(bestTip.name, fallbackPoiResult.pois || []);
            }
          }

          if (matchedPoi) {
            const costRange = parsePoiCostRange(matchedPoi.business?.cost);
            const inferredCategory = inferCategoryFromPoi(matchedPoi);
            const inferredDescription = buildPoiDescription(matchedPoi);
            const preciseLocation = parsePoiLocation(matchedPoi.location);

            if (matchedPoi.business?.rating) setNewRating(String(Number(matchedPoi.business.rating)));
            if (costRange) {
              setNewPriceMin(String(costRange.min));
              setNewPriceMax(String(costRange.max));
            }
            if (!data.category && inferredCategory) setNewCategory(inferredCategory);
            if (!data.kind) {
              setNewKind(matchedPoi.business?.tag || matchedPoi.type.split(';').pop() || matchedPoi.type);
            }
            if (!data.description && inferredDescription) setNewDescription(inferredDescription);
            if (matchedPoi.cityname) setNewCity(matchedPoi.cityname);
            if (preciseLocation) setNewPoiLocation(preciseLocation);
          }
        } catch (poiError) {
          console.error('POI enrichment failed:', poiError);
        } finally {
          setIsPoiEnriching(false);
        }
      }

      setAiInputText('');
      setAiInputImage(null);
      setAiInputImageDataUrl(null);
      setAiInputImagePreview(null);
    } catch (error) {
      console.error('AI Recognition failed:', error);
      alert('识别失败，请重试或手动输入。');
    } finally {
      setIsAiRecognizing(false);
    }
  };

  const handleDeletePlace = async (id: string) => {
    try {
      await deletePlace(id);
      if (selectedPlaceId === id) setSelectedPlaceId(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('删除失败，您可能没有权限删除此地点。');
    }
  };

  const handleAddPlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRating || !newPriceMin || !newPriceMax || !newCategory || !newKind || !newCity) return;
    setIsAddingPlace(true);

    try {
      let lat = 30.5928;
      let lng = 114.3055;

      try {
        if (newPoiLocation) {
          [lat, lng] = newPoiLocation;
        } else {
          const poiResult = await poiSearch(newName, newCity || undefined);
          const matchedPoi = pickBestPoi(newName, poiResult.pois || []);
          const poiLocation = parsePoiLocation(matchedPoi?.location);

          if (poiLocation) {
            [lat, lng] = poiLocation;
          } else {
            const jsResult = await geocodeAddress(`${newCity} ${newName}`, newCity);
            if (jsResult) {
              [lat, lng] = jsResult;
            } else {
              const geoResult = await geocode(`${newCity} ${newName}`, newCity);
              if (geoResult.status === '1' && geoResult.geocodes?.length > 0) {
                const [gLng, gLat] = geoResult.geocodes[0].location.split(',').map(Number);
                lat = gLat;
                lng = gLng;
              }
            }
          }
        }
      } catch {
        const cityDefaults: Record<string, [number, number]> = {
          '上海': [31.23, 121.47], '北京': [39.90, 116.41],
          '广州': [23.13, 113.26], '深圳': [22.54, 114.06],
        };
        const fallback = Object.entries(cityDefaults).find(([k]) => newCity.includes(k));
        const [baseLat, baseLng] = fallback ? fallback[1] : [30.59, 114.31];
        lat = baseLat + (Math.random() - 0.5) * 0.05;
        lng = baseLng + (Math.random() - 0.5) * 0.05;
      }

      await addPlace({
        name: newName,
        rating: parseFloat(newRating),
        price: `¥${newPriceMin}-${newPriceMax}`,
        category: newCategory,
        kind: newKind,
        description: newDescription || '暂无描述',
        city: newCity,
        position: [lat, lng],
      });

      setIsAddModalOpen(false);
      clearAddPlaceForm();
    } catch (err) {
      console.error('Add place failed:', err);
      alert('添加地点失败，请重试。');
    } finally {
      setIsAddingPlace(false);
    }
  };

  const toggleCategory = (category: Category) => {
    const newCategories = new Set(activeCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setActiveCategories(newCategories);
    setAiRecommendedIds([]);
    setAiReasoning('');
  };

  const filteredPlaces = placesList.filter((place) => {
    if (showFavoritesOnly && !place.isFavorite) return false;
    if (aiRecommendedIds.length > 0) return aiRecommendedIds.includes(place.id);
    return activeCategories.has(place.category);
  });

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      await toggleFavorite(id);
    } catch (err) {
      console.error('Toggle favorite failed:', err);
    }
  }, [toggleFavorite]);

  const handleAiSearch = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setIsAiSearching(true);
      setAiReasoning('');
      setAiRecommendedIds([]);

      try {
        const result: AiSearchResult = await aiSearch(searchQuery, placesList);
        if (result.recommendedIds?.length > 0) {
          setAiRecommendedIds(result.recommendedIds);
          setAiReasoning(result.reasoning || '');
        } else {
          setAiReasoning('抱歉，没有找到完全符合你要求的地点。');
        }
      } catch (error) {
        console.error('AI Search Error:', error);
        setAiReasoning('AI 搜索出错了，请稍后再试。');
      } finally {
        setIsAiSearching(false);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!isLoginMode) {
      if (password.length < 8) {
        setAuthError('密码长度不能少于8位');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('两次输入的密码不一致');
        return;
      }
    }

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || '操作失败，请重试');
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowAuth(false);
    setShowUserMenu(false);
  };

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!isLoggedIn && !showAuth) {
    return (
      <div className="h-screen w-full bg-gray-50 overflow-y-auto overflow-x-hidden relative font-sans scroll-smooth">
        <style>{`
          @media (max-width: 767px) {
            .mobile-slogan-1 { animation: slogan1 6s infinite; }
            .mobile-slogan-2 { animation: slogan2 6s infinite; }
            @keyframes slogan1 {
              0%, 40% { transform: translateY(0); opacity: 1; }
              45%, 50% { transform: translateY(-20px); opacity: 0; }
              50%, 90% { transform: translateY(-20px); opacity: 0; }
              95%, 100% { transform: translateY(0); opacity: 1; }
            }
            @keyframes slogan2 {
              0%, 40% { transform: translateY(20px); opacity: 0; }
              45%, 50% { transform: translateY(0); opacity: 1; }
              50%, 90% { transform: translateY(0); opacity: 1; }
              95%, 100% { transform: translateY(20px); opacity: 0; }
            }
          }
        `}</style>
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px] pointer-events-none" />

        <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-6">
          <div className="hidden md:flex absolute top-[20%] left-[15%] animate-bounce" style={{ animationDuration: '4s' }}>
            <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 text-gray-700 font-medium flex items-center gap-2 transition-all duration-300">
              {hoveredButton === 'login' ? '🗺️ 我的足迹' : hoveredButton === 'register' ? '🚀 开启新旅程' : '☕️ 隐秘咖啡馆'}
            </div>
          </div>
          <div className="hidden md:flex absolute top-[30%] right-[15%] animate-bounce" style={{ animationDuration: '5s', animationDelay: '1s' }}>
            <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 text-gray-700 font-medium flex items-center gap-2 transition-all duration-300">
              {hoveredButton === 'login' ? '❤️ 收藏清单' : hoveredButton === 'register' ? '🌍 探索未知' : '🍜 深夜食堂'}
            </div>
          </div>
          <div className="hidden md:flex absolute bottom-[20%] left-[10%] animate-bounce" style={{ animationDuration: '4.5s', animationDelay: '0.5s' }}>
            <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 text-gray-700 font-medium flex items-center gap-2 transition-all duration-300">
              {hoveredButton === 'login' ? '🌟 专属推荐' : hoveredButton === 'register' ? '🤝 结识同好' : '📸 拍照圣地'}
            </div>
          </div>
          <div className="hidden md:flex absolute bottom-[15%] right-[10%] animate-bounce" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}>
            <div className="bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/50 text-gray-700 font-medium flex items-center gap-2 transition-all duration-300">
              {hoveredButton === 'login' ? '📝 城市日记' : hoveredButton === 'register' ? '🎁 新人福利' : '🎨 艺术展览'}
            </div>
          </div>

          <div className="flex flex-col items-center max-w-4xl w-full animate-in fade-in zoom-in-95 duration-700 relative z-20">
            <div className="relative h-40 md:h-48 flex items-center justify-center overflow-hidden cursor-default group mb-12 mt-16 md:mt-0 w-full px-4">
               <div className="mobile-slogan-1 absolute inset-0 flex items-center justify-center w-full md:transition-all md:duration-700 md:ease-in-out md:transform md:group-hover:-translate-y-full md:group-hover:opacity-0">
                  <h1 className="text-5xl sm:text-6xl md:text-8xl font-black text-gray-900 tracking-tight text-center">城市指南</h1>
               </div>
               <div className="mobile-slogan-2 absolute inset-0 flex items-center justify-center w-full opacity-0 md:transition-all md:duration-700 md:ease-in-out md:transform md:translate-y-full md:group-hover:translate-y-0 md:group-hover:opacity-100">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500 tracking-wide text-center leading-tight">
                    发现城市精彩
                  </h1>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mt-8">
              <button
                onClick={() => { setIsLoginMode(true); setShowAuth(true); }}
                onMouseEnter={() => setHoveredButton('login')}
                onMouseLeave={() => setHoveredButton(null)}
                className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-lg"
              >
                登录账号
              </button>
              <button
                onClick={() => { setIsLoginMode(false); setShowAuth(true); }}
                onMouseEnter={() => setHoveredButton('register')}
                onMouseLeave={() => setHoveredButton(null)}
                className="flex-1 py-4 px-6 bg-white hover:bg-gray-50 text-gray-800 font-medium rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 transition-all hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 text-lg"
              >
                注册新账号
              </button>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-400">
            <ChevronDown size={32} />
          </div>
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center relative z-10 px-6 py-20">
          <div className="max-w-5xl w-full">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-16 text-center">强大功能，助你玩转城市</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group flex items-start gap-5">
                <div className="w-14 h-14 shrink-0 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Map size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">互动地图探索</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">直观的地图界面，轻松浏览城市各个角落的有趣地点，支持一键定位与视角重置。</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group flex items-start gap-5">
                <div className="w-14 h-14 shrink-0 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                  <Sparkles size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">AI 智能推荐</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">不知道去哪？告诉 AI 你的需求，获取量身定制的地点推荐与贴心理由。</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group flex items-start gap-5">
                <div className="w-14 h-14 shrink-0 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                  <Plus size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">共建城市记忆</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">发现宝藏店铺？随时添加新地点并打分，与所有人分享你的城市专属印记。</p>
                </div>
              </div>

              <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 shadow-xl shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 group flex items-start gap-5">
                <div className="w-14 h-14 shrink-0 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                  <Heart size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">专属收藏夹</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">一键收藏心仪地点，随时通过专属视图查看你的"想去"清单，不再错过任何美好。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn && showAuth) {
    return (
      <div className="min-h-screen w-full bg-white md:bg-gray-50 flex items-center justify-center relative overflow-hidden font-sans">
        <div className="hidden md:block absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px] pointer-events-none" />
        <div className="hidden md:block absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 blur-[100px] pointer-events-none" />

        <div className="bg-white md:bg-white/80 md:backdrop-blur-xl p-8 md:p-10 md:rounded-3xl md:shadow-2xl z-10 w-full min-h-screen md:min-h-0 md:h-auto md:max-w-md md:border md:border-white/50 relative flex flex-col justify-center">
          <button
            onClick={() => setShowAuth(false)}
            className="absolute top-6 left-4 md:left-6 text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none"
            title="返回首页"
          >
            <ChevronLeft size={28} className="md:hidden" />
            <X size={20} className="hidden md:block" />
          </button>

          <div className="flex justify-center mb-6 mt-2">
            <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/30">
              <Map size={36} strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">欢迎来到城市指南</h1>
          <p className="text-center text-gray-500 mb-8 text-sm">发现这座城市的每一个精彩角落</p>

          <form onSubmit={handleAuth} className="space-y-5">
            {authError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {authError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/50"
                placeholder="请输入用户名"
                minLength={2}
                maxLength={20}
              />
              {!isLoginMode && (
                <p className="text-xs text-gray-400 mt-1">2-20位，支持中英文、数字和下划线</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/50"
                placeholder="••••••••"
                minLength={8}
              />
              {!isLoginMode && (
                <p className="text-xs text-gray-400 mt-1">密码至少8位</p>
              )}
            </div>
            {!isLoginMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all bg-white/50"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 px-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {isLoginMode ? '登录' : '注册'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setAuthError('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {isLoginMode ? '没有账号？点击注册' : '已有账号？点击登录'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 font-sans relative">
      <Sidebar
        activeCategories={activeCategories}
        toggleCategory={toggleCategory}
        places={filteredPlaces}
        selectedPlaceId={selectedPlaceId}
        onSelectPlace={setSelectedPlaceId}
        onToggleFavorite={handleToggleFavorite}
        showFavoritesOnly={showFavoritesOnly}
        onToggleShowFavorites={() => {
          setShowFavoritesOnly(!showFavoritesOnly);
          setSelectedPlaceId(null);
        }}
        aiReasoning={aiReasoning}
        onClearAi={() => {
          setAiRecommendedIds([]);
          setAiReasoning('');
          setSearchQuery('');
        }}
        onDeletePlace={handleDeletePlace}
      />
      <div className="flex-1 relative z-0 h-full">
        <div className="absolute top-4 left-4 right-4 md:top-6 md:left-auto md:right-6 z-10 flex justify-between md:justify-end items-start pointer-events-none">

          <div className="pointer-events-auto relative shadow-md md:shadow-lg rounded-full bg-white/95 backdrop-blur-sm flex items-center w-[66%] md:w-80 group border border-purple-100 md:border-2 md:border-transparent focus-within:border-purple-300 focus-within:ring-2 focus-within:ring-purple-100 transition-all h-10 md:h-12">
            {isAiSearching ? (
              <Loader2 className="absolute left-3 md:left-4 text-purple-500 animate-spin" size={18} />
            ) : (
              <Sparkles className="absolute left-3 md:left-4 text-purple-400 group-focus-within:text-purple-600 transition-colors" size={18} />
            )}
            <input
              type="text"
              placeholder="AI 推荐..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleAiSearch}
              onFocus={ensureMobileDrawerVisible}
              onTouchStart={ensureMobileDrawerVisible}
              disabled={isAiSearching}
              className="w-full h-full bg-transparent pl-10 pr-4 text-sm text-gray-800 focus:outline-none placeholder-gray-400 disabled:opacity-50 rounded-full md:hidden"
            />
            <input
              type="text"
              placeholder="AI 推荐：想吃什么？人均多少？"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleAiSearch}
              onFocus={ensureMobileDrawerVisible}
              disabled={isAiSearching}
              className="w-full h-full bg-transparent pl-12 pr-4 text-sm text-gray-800 focus:outline-none placeholder-gray-400 disabled:opacity-50 rounded-full hidden md:block"
            />

            {aiReasoning && (
              <div className="hidden md:block absolute top-full left-0 mt-2 md:mt-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-3 md:p-4 border border-purple-100 text-sm text-gray-700 leading-relaxed animate-in fade-in slide-in-from-top-2">
                <div className="flex items-start gap-2">
                  <Sparkles className="text-purple-500 shrink-0 mt-0.5" size={16} />
                  <p>{aiReasoning}</p>
                </div>
                <button
                  onClick={() => {
                    setAiRecommendedIds([]);
                    setAiReasoning('');
                    setSearchQuery('');
                  }}
                  className="mt-3 text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  清除推荐
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 pointer-events-auto">
            <button
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setSelectedPlaceId(null);
              }}
              className={`hidden md:flex items-center justify-center w-12 h-12 rounded-full shadow-lg border-2 transition-all duration-300 focus:outline-none ${
                showFavoritesOnly
                  ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                  : 'bg-white border-transparent text-gray-400 hover:border-red-100 hover:text-red-500'
              }`}
              title={showFavoritesOnly ? "显示所有地点" : "只显示收藏"}
            >
              <Heart size={18} className={showFavoritesOnly ? "fill-current" : ""} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-md md:shadow-lg flex items-center justify-center text-gray-600 hover:text-blue-600 hover:shadow-xl transition-all border border-gray-100 md:border-2 md:border-transparent hover:border-blue-100 focus:outline-none"
              >
                <User size={18} className="md:w-5 md:h-5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 md:mt-3 w-48 bg-white rounded-2xl shadow-xl py-2 border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1 bg-gray-50/50">
                    <p className="text-sm font-bold text-gray-900 truncate">{displayName || 'User'}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">ID: {user?.id?.slice(0, 8)}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center justify-center w-10 h-10 md:w-auto md:h-12 md:px-5 bg-white text-gray-600 rounded-full shadow-md md:shadow-lg border border-gray-100 md:border-2 md:border-transparent hover:border-blue-100 hover:text-blue-600 hover:shadow-xl transition-all duration-300 focus:outline-none"
              title="添加新地点"
            >
              <Plus size={18} className="md:mr-2 text-blue-600" />
              <span className="text-sm font-medium hidden md:inline">添加地点</span>
            </button>
          </div>
        </div>

        <MapView
          places={filteredPlaces}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
          onToggleFavorite={handleToggleFavorite}
          onDeletePlace={handleDeletePlace}
        />
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">添加新地点</h2>
              <button
                onClick={() => { setIsAddModalOpen(false); setIsAddingPlace(false); setIsPoiEnriching(false); }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="mb-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <h3 className="text-sm font-bold text-purple-900 mb-2 flex items-center gap-2">
                  <Sparkles size={16} /> AI 智能识别填表
                </h3>
                <p className="text-xs text-purple-700 mb-3">
                  粘贴大众点评/小红书分享文案，或上传截图，AI将自动提取信息。
                </p>
                <p className="text-[11px] text-purple-600/90 mb-3">
                  图片会在上传时自动压缩并转成标准 JPG，仅支持 PNG、JPG、WEBP。
                </p>
                <textarea
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  placeholder="在此粘贴分享文案..."
                  className="w-full text-sm p-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 focus:outline-none mb-2 resize-none"
                  rows={3}
                />
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50 transition-colors text-sm text-purple-700">
                    <Upload size={16} />
                    {aiInputImage ? '已选择图片' : '上传截图'}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const normalizedDataUrl = await prepareImageForAi(file);
                          setAiInputImage(file);
                          setAiInputImageDataUrl(normalizedDataUrl);
                          setAiInputImagePreview(normalizedDataUrl);
                        } catch (error) {
                          console.error('Prepare AI image failed:', error);
                          alert(error instanceof Error ? error.message : '图片处理失败，请换一张图片重试。');
                          setAiInputImage(null);
                          setAiInputImageDataUrl(null);
                          setAiInputImagePreview(null);
                          e.target.value = '';
                        }
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAiRecognize}
                    disabled={isAiRecognizing || isPoiEnriching || (!aiInputText && !aiInputImage)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    {(isAiRecognizing || isPoiEnriching) ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                    {isAiRecognizing ? '识别中...' : isPoiEnriching ? '补全中...' : '一键识别'}
                  </button>
                </div>
                {isPoiEnriching && (
                  <p className="mt-2 text-xs text-purple-700">
                    正在匹配高德店铺信息并补全评分、均价与城市...
                  </p>
                )}
                {aiInputImagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img src={aiInputImagePreview} alt="Preview" className="h-20 rounded-lg border border-purple-200" />
                    <button
                      type="button"
                      onClick={() => { setAiInputImage(null); setAiInputImageDataUrl(null); setAiInputImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-white rounded-full shadow-md p-1 text-gray-500 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative flex items-center py-2 mb-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">或手动输入</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleAddPlace} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => {
                      setNewName(e.target.value);
                      setNewPoiLocation(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：黄鹤楼"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => {
                      setNewCity(e.target.value);
                      setNewPoiLocation(null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：武汉"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">星级 (1-5)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="5"
                    step="0.1"
                    value={newRating}
                    onChange={(e) => setNewRating(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">均价 (¥)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      required
                      min="0"
                      value={newPriceMin}
                      onChange={(e) => setNewPriceMin(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="最低"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newPriceMax}
                      onChange={(e) => setNewPriceMax(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="最高"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as Category)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">种类 (个性化定义)</label>
                  <input
                    type="text"
                    required
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：漂亮饭、西餐"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="简单描述一下这个地点（选填）..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={clearAddPlaceForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  清空
                </button>
                <button
                  type="submit"
                  disabled={isAddingPlace}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center gap-2"
                >
                  {isAddingPlace && <Loader2 size={14} className="animate-spin" />}
                  {isAddingPlace ? '添加中...' : '添加地点'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
