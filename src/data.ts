export type Category = 'clothes' | 'malls' | 'breakfast' | 'lunch' | 'dinner' | 'coffee' | 'bars';

export interface Place {
  id: string;
  name: string;
  description: string;
  category: Category;
  kind: string;
  position: [number, number]; // [lat, lng]
  rating: number;
  price: string;
  isFavorite?: boolean;
  city?: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  clothes: '#ec4899',
  malls: '#8b5cf6',
  breakfast: '#f59e0b',
  lunch: '#ef4444',
  dinner: '#b91c1c',
  coffee: '#78350f',
  bars: '#3b82f6',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  clothes: '衣服',
  malls: '商场',
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  coffee: '咖啡店',
  bars: '酒吧',
};
