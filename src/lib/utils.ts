import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 用于管理收藏的 symbols
export const getFavoriteSymbols = (): string[] => {
  if (typeof window === 'undefined') return [];
  const favorites = localStorage.getItem('favoriteSymbols');
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
  
  localStorage.setItem('favoriteSymbols', JSON.stringify(favorites));
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
