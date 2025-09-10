import { useState, useEffect, useCallback } from 'react'
import { useSession } from './useSession'

export interface UseFavoritesReturn {
  favorites: Set<string>
  isFavorite: (symbol: string) => boolean
  toggleFavorite: (symbol: string) => void
  addFavorite: (symbol: string) => void
  removeFavorite: (symbol: string) => void
  clearFavorites: () => void
  favoritesList: string[]
}

export const useFavorites = (): UseFavoritesReturn => {
  const { user } = useSession()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  // Load from server when logged in
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) {
        setFavorites(new Set())
        return
      }
      try {
        const res = await fetch('/api/favorites', { cache: 'no-store' })
        if (!cancelled && res.ok) {
          const data = await res.json()
          setFavorites(new Set<string>((data.favorites || []) as string[]))
        }
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const isFavorite = useCallback((symbol: string) => {
    return favorites.has(symbol)
  }, [favorites])

  const addFavorite = useCallback((symbol: string) => {
    if (!user) return
    setFavorites(prev => new Set(prev).add(symbol))
    fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to add favorite')
    }).catch(() => {
      // rollback on error
      setFavorites(prev => {
        const n = new Set(prev)
        n.delete(symbol)
        return n
      })
    })
  }, [user])

  const removeFavorite = useCallback((symbol: string) => {
    if (!user) return
    setFavorites(prev => {
      const n = new Set(prev)
      n.delete(symbol)
      return n
    })
    fetch(`/api/favorites?symbol=${encodeURIComponent(symbol)}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to remove favorite')
      })
      .catch(() => {
        // rollback on error
        setFavorites(prev => new Set(prev).add(symbol))
      })
  }, [user])

  const toggleFavorite = useCallback((symbol: string) => {
    if (favorites.has(symbol)) removeFavorite(symbol)
    else addFavorite(symbol)
  }, [favorites, addFavorite, removeFavorite])

  const clearFavorites = useCallback(() => {
    setFavorites(new Set())
  }, [])

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    favoritesList: Array.from(favorites),
  }
}
