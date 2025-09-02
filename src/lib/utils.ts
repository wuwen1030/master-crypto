import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 用于管理收藏的 symbols - 统一使用 'symbol-favorites' key
const FAVORITES_KEY = 'symbol-favorites';

export const getFavoriteSymbols = (): string[] => {
  if (typeof window === 'undefined') return [];
  const favorites = localStorage.getItem(FAVORITES_KEY);
  return favorites ? JSON.parse(favorites) : [];
};

export const toggleFavoriteSymbol = (symbol: string) => {
  const favorites = getFavoriteSymbols();
  const index = favorites.indexOf(symbol);
  
  if (index === -1) {
    favorites.push(symbol);
  } else {
    favorites.splice(index, 1);
  }
  
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return favorites;
};

// 添加新的存储方法
export const getShowOnlyFavorites = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('showOnlyFavorites') === 'true';
};

export const setShowOnlyFavorites = (value: boolean) => {
  localStorage.setItem('showOnlyFavorites', value.toString());
};
