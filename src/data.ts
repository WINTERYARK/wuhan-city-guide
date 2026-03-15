export type Category = 'clothes' | 'malls' | 'breakfast' | 'meal' | 'coffee' | 'bakery' | 'bars';

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
  meal: '#dc2626',
  coffee: '#78350f',
  bakery: '#d97706',
  bars: '#3b82f6',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  clothes: '衣服',
  malls: '商场',
  breakfast: '早餐',
  meal: '正餐',
  coffee: '咖啡店',
  bakery: '面包店',
  bars: '酒吧',
};
