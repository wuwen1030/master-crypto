import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'symbol-favorites';

export interface UseFavoritesReturn {
  favorites: Set<string>;
  isFavorite: (symbol: string) => boolean;
  toggleFavorite: (symbol: string) => void;
  addFavorite: (symbol: string) => void;
  removeFavorite: (symbol: string) => void;
  clearFavorites: () => void;
  favoritesList: string[];
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // 从 localStorage 加载收藏列表
  useEffect(() => {
    try {
      const savedFavorites = localStorage.getItem(FAVORITES_KEY);
      if (savedFavorites) {
        const favoritesArray = JSON.parse(savedFavorites);
        setFavorites(new Set(favoritesArray));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }, []);

  // 保存收藏列表到 localStorage
  const saveFavorites = useCallback((newFavorites: Set<string>) => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(newFavorites)));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, []);

  // 检查是否为收藏
  const isFavorite = useCallback((symbol: string) => {
    return favorites.has(symbol);
  }, [favorites]);

  // 切换收藏状态
  const toggleFavorite = useCallback((symbol: string) => {
    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(symbol)) {
        newFavorites.delete(symbol);
      } else {
        newFavorites.add(symbol);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // 添加收藏
  const addFavorite = useCallback((symbol: string) => {
    setFavorites(prevFavorites => {
      if (prevFavorites.has(symbol)) {
        return prevFavorites;
      }
      const newFavorites = new Set(prevFavorites);
      newFavorites.add(symbol);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // 移除收藏
  const removeFavorite = useCallback((symbol: string) => {
    setFavorites(prevFavorites => {
      if (!prevFavorites.has(symbol)) {
        return prevFavorites;
      }
      const newFavorites = new Set(prevFavorites);
      newFavorites.delete(symbol);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // 清空收藏
  const clearFavorites = useCallback(() => {
    const newFavorites = new Set<string>();
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  }, [saveFavorites]);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    favoritesList: Array.from(favorites),
  };
};
