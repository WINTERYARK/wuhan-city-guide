import React, { useState, useEffect } from 'react';
import { Category, CATEGORY_COLORS, CATEGORY_LABELS, Place } from '../data';
import { Map, Check, MapPin, Search, PanelLeft, ChevronDown, ChevronRight, Maximize2, Minimize2, Star, X, Heart, Sparkles, Trash2 } from 'lucide-react';

interface SidebarProps {
  activeCategories: Set<Category>;
  toggleCategory: (category: Category) => void;
  places: Place[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string | null) => void;
  onToggleFavorite: (id: string) => void;
  showFavoritesOnly: boolean;
  onToggleShowFavorites: () => void;
  aiReasoning?: string;
  onClearAi?: () => void;
  onDeletePlace: (id: string) => void;
}

export default function Sidebar({ 
  activeCategories, 
  toggleCategory, 
  places,
  selectedPlaceId,
  onSelectPlace,
  onToggleFavorite,
  showFavoritesOnly,
  onToggleShowFavorites,
  aiReasoning,
  onClearAi,
  onDeletePlace
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isExpanding, setIsExpanding] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);
  const categories = Object.keys(CATEGORY_COLORS) as Category[];

  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (aiReasoning && window.innerWidth < 768) {
      setIsOpen(true);
      setIsMaximized(false);
      setIsExpanding(true);
    }
  }, [aiReasoning]);

  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth < 768) {
        const root = document.documentElement;
        if (isMaximized) {
          root.style.setProperty('--drawer-height', '90vh');
          document.body.classList.add('sidebar-maximized');
        } else if (isOpen) {
          root.style.setProperty('--drawer-height', '50vh');
          document.body.classList.remove('sidebar-maximized');
        } else {
          root.style.setProperty('--drawer-height', '86px');
          document.body.classList.remove('sidebar-maximized');
        }
      } else {
        document.documentElement.style.setProperty('--drawer-height', '0px');
        document.body.classList.remove('sidebar-maximized');
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [isOpen, isMaximized]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const y = e.touches[0].clientY;
    setStartY(y);
    setCurrentY(y);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaY = currentY - startY;
    
    if (deltaY < -50) {
      if (!isOpen) {
        setIsOpen(true);
        setIsExpanding(true);
      } else if (!isMaximized) {
        setIsMaximized(true);
        setIsExpanding(false);
      }
    } else if (deltaY > 50) {
      if (isMaximized) {
        setIsMaximized(false);
        setIsExpanding(false);
      } else if (isOpen) {
        setIsOpen(false);
        setIsExpanding(true);
      }
    }
  };

  const displayedPlaces = places.filter(place => 
    place.name.toLowerCase().includes(listSearchQuery.toLowerCase()) ||
    place.description.toLowerCase().includes(listSearchQuery.toLowerCase())
  );

  const handleMobileToggle = () => {
    if (window.innerWidth < 768) {
      if (!isOpen) {
        setIsOpen(true);
        setIsExpanding(true);
      } else if (!isMaximized) {
        if (isExpanding) {
          setIsMaximized(true);
          setIsExpanding(false);
        } else {
          setIsOpen(false);
          setIsExpanding(true);
        }
      } else {
        setIsMaximized(false);
        setIsExpanding(false);
      }
    }
  };

  return (
    <>
      {/* Floating Map Icon when closed */}
      <button
        onClick={() => setIsOpen(true)}
        className={`hidden md:block absolute top-6 left-6 z-30 p-3 bg-white rounded-xl shadow-lg border border-gray-200 text-blue-600 hover:bg-gray-50 transition-all duration-300 ${
          isOpen ? 'opacity-0 pointer-events-none -translate-x-10' : 'opacity-100 translate-x-0'
        }`}
        title="Expand sidebar"
      >
        <Map size={24} />
      </button>

      {/* Sidebar Panel */}
      <div 
        className={`bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-2xl z-40 transition-all duration-300 ease-in-out shrink-0 overflow-hidden flex flex-col
          md:relative md:left-0 md:top-0 md:h-full md:border-r md:border-gray-100 md:rounded-none md:translate-y-0
          ${isOpen ? (isMaximized ? 'md:w-full' : 'md:w-64') : 'md:w-0 md:border-r-0'}
          
          absolute left-0 bottom-0 w-full rounded-t-3xl border-t border-gray-200
          ${isMaximized ? 'h-[90vh] translate-y-0' : (isOpen ? 'h-[50vh] translate-y-0' : 'h-[50vh] translate-y-[calc(100%-86px)]')}
        `}
      >
        {/* Mobile Drag Handle */}
        <div 
          className="md:hidden w-full flex justify-center pt-3 pb-2 cursor-pointer bg-gray-50/50 shrink-0"
          onClick={handleMobileToggle}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        <div className={`flex-1 flex flex-col min-w-[256px] overflow-hidden ${isMaximized ? 'w-full' : 'w-full md:w-64'}`}>
          {/* Header */}
          <div 
            className="h-[60px] md:h-[76px] px-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0 cursor-pointer md:cursor-default"
            onClick={handleMobileToggle}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Desktop Title */}
            <div className="hidden md:flex items-center gap-3">
              <div className="p-2 md:p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
                <Map size={20} className="md:w-6 md:h-6" />
              </div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">城市指南</h1>
            </div>

            {/* Mobile Search & Favorites */}
            <div className="md:hidden flex-1 flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="在列表中搜索..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShowFavorites();
                }}
                className={`flex items-center justify-center w-9 h-9 shrink-0 rounded-xl shadow-sm border transition-all duration-300 focus:outline-none ${
                  showFavoritesOnly 
                    ? 'bg-red-50 border-red-200 text-red-500' 
                    : 'bg-white border-gray-200 text-gray-400'
                }`}
              >
                <Heart size={16} className={showFavoritesOnly ? "fill-current" : ""} />
              </button>
            </div>

            {isMaximized ? (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsMaximized(false); }}
                className="hidden md:flex p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors items-center justify-center cursor-pointer"
                title="还原"
              >
                <Minimize2 size={20} strokeWidth={1.5} className="md:w-6 md:h-6" />
              </button>
            ) : (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="hidden md:flex p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors items-center justify-center cursor-pointer"
                title="收起"
              >
                <PanelLeft size={24} strokeWidth={1.5} className="hidden md:block" />
              </button>
            )}
          </div>

          {/* Content Wrapper */}
          <div className={`flex-1 flex ${isMaximized ? 'flex-col md:flex-row' : 'flex-col'} overflow-y-auto md:overflow-hidden`}>
            {/* Filters */}
            <div className={`p-4 md:p-6 border-gray-100 shrink-0 ${isMaximized ? 'md:w-64 md:border-r md:border-b-0 border-b md:overflow-y-auto' : 'border-b'}`}>
              
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Search size={14} />
                  类别筛选
                </h2>
                <button
                  onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                  className="hidden md:block p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  title={isCategoriesExpanded ? "收起" : "展开"}
                >
                  {isCategoriesExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              </div>
              
              {isCategoriesExpanded && (
                <div className={`flex overflow-x-auto md:grid ${isMaximized ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-2 pb-2 md:pb-0 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
                  {categories.map((category) => {
                    const isActive = activeCategories.has(category);
                    const color = CATEGORY_COLORS[category];
                    
                    return (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={`
                          shrink-0 snap-start group flex items-center gap-2 md:gap-3 px-3 py-1.5 md:py-2 rounded-full md:rounded-lg text-sm font-medium transition-all duration-300 text-left border
                          ${isActive 
                            ? 'shadow-sm hover:[background-color:var(--cat-bg-hover)] hover:[box-shadow:0_0_12px_var(--cat-glow)]' 
                            : 'bg-gray-50 text-gray-500 border-transparent hover:bg-white hover:text-gray-700 hover:shadow-[0_0_10px_rgba(0,0,0,0.05)]'}
                        `}
                        style={{
                          '--cat-color': color,
                          '--cat-bg': `${color}15`,
                          '--cat-bg-hover': `${color}25`,
                          '--cat-border': `${color}40`,
                          '--cat-glow': `${color}30`,
                          backgroundColor: isActive ? 'var(--cat-bg)' : undefined,
                          color: isActive ? 'var(--cat-color)' : undefined,
                          borderColor: isActive ? 'var(--cat-border)' : 'transparent'
                        } as React.CSSProperties}
                      >
                        <div 
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                          style={{ 
                            backgroundColor: isActive ? 'var(--cat-color)' : '#d1d5db',
                            boxShadow: isActive ? '0 0 8px var(--cat-glow)' : 'none'
                          }}
                        >
                          {isActive && <Check size={10} className="text-white" />}
                        </div>
                        <span className="whitespace-nowrap">{CATEGORY_LABELS[category]}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Places List */}
            <div className="flex-1 md:overflow-y-auto p-4 bg-gray-50/30">
              {/* Mobile AI Reasoning Banner */}
              {aiReasoning && (
                <div className="md:hidden mb-4 bg-purple-50/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-2 text-sm text-purple-800 leading-relaxed">
                    <Sparkles className="shrink-0 mt-0.5 text-purple-500" size={16} />
                    <p>{aiReasoning}</p>
                  </div>
                  <button onClick={onClearAi} className="mt-3 text-xs text-purple-600 font-medium border border-purple-200 bg-white px-3 py-1.5 rounded-full shadow-sm hover:bg-purple-50 transition-colors">
                    清除推荐
                  </button>
                </div>
              )}
              <div className="hidden md:block mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="在列表中搜索..."
                    value={listSearchQuery}
                    onChange={(e) => setListSearchQuery(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 px-2">
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  找到 {displayedPlaces.length} 个地点
                </h2>
                {!isMaximized && (
                  <button
                    onClick={() => {
                      setIsMaximized(true);
                      onSelectPlace(null);
                    }}
                    className="hidden md:block p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                    title="放大"
                  >
                    <Maximize2 size={16} />
                  </button>
                )}
              </div>
              
              <div className={isMaximized ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" : "grid grid-cols-2 md:grid-cols-1 gap-3"}>
                {displayedPlaces.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 col-span-full">
                    <p>未找到符合条件的地点。</p>
                  </div>
                ) : (
                  displayedPlaces.map((place) => {
                    const isSelected = place.id === selectedPlaceId;
                    const color = CATEGORY_COLORS[place.category];
                    
                    return (
                      <button
                        key={place.id}
                        onClick={() => {
                          onSelectPlace(isSelected ? null : place.id);
                          if (!isSelected && window.innerWidth < 768) {
                            setShowDetailModal(true);
                          }
                        }}
                        className={`
                          w-full text-left p-3 rounded-xl transition-all duration-200 border focus:outline-none flex flex-col gap-2
                          ${isSelected 
                            ? 'bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-500/20' 
                            : 'bg-white border-transparent shadow-sm hover:shadow-md hover:border-gray-200'}
                        `}
                      >
                        <div className="flex items-start justify-between w-full">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{place.name}</h3>
                          {place.isFavorite && (
                            <Heart size={14} className="fill-red-500 text-red-500 shrink-0 ml-1" />
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between w-full mt-auto">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star size={12} className="fill-current" />
                            <span className="font-bold text-xs">{place.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-xs font-medium text-gray-500">{place.price}</span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 w-full overflow-hidden">
                          <span 
                            className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                            style={{ backgroundColor: `${color}15`, color: color }}
                          >
                            {CATEGORY_LABELS[place.category]}
                          </span>
                          {place.kind && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 truncate">
                              {place.kind}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal in Maximized View or Mobile Click */}
      {((isMaximized && selectedPlaceId) || (showDetailModal && selectedPlaceId)) && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => {
            onSelectPlace(null);
            setShowDetailModal(false);
          }}
        >
          {(() => {
            const place = places.find(p => p.id === selectedPlaceId);
            if (!place) return null;
            const color = CATEGORY_COLORS[place.category];
            const label = CATEGORY_LABELS[place.category];
            
            return (
              <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button 
                    onClick={() => {
                      if (window.confirm('确定要删除这个地点吗？')) {
                        onDeletePlace(place.id);
                        setShowDetailModal(false);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="删除"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    onClick={() => {
                      onSelectPlace(null);
                      setShowDetailModal(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-6">
                  {/* Name and Star Rating */}
                  <div className="flex justify-between items-start mb-1 pr-8">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {place.name}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(place.id);
                          }}
                          className="p-1.5 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
                          title={place.isFavorite ? "取消收藏" : "加入收藏"}
                        >
                          <Heart size={22} className={place.isFavorite ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-400"} />
                        </button>
                      </h2>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const isFilled = i < Math.floor(place.rating);
                          const isHalf = !isFilled && i < place.rating;
                          return (
                            <div key={i} className="relative">
                              <Star size={16} className="text-gray-200" fill="currentColor" />
                              {(isFilled || isHalf) && (
                                <div className="absolute inset-0 overflow-hidden" style={{ width: isFilled ? '100%' : '50%' }}>
                                  <Star size={16} className="text-amber-400" fill="currentColor" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <span className="ml-1.5 font-bold text-sm text-amber-600">{place.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Average Price */}
                  <div className="text-lg font-medium text-gray-700 mb-4 mt-2">
                    均价：{place.price}
                  </div>
                  
                  {/* Type and Kind */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span 
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{ backgroundColor: `${color}15`, color: color }}
                    >
                      {label}
                    </span>
                    {place.kind && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                        {place.kind}
                      </span>
                    )}
                  </div>
                  
                  {/* Intro */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">简介</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {place.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
