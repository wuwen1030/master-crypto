"use client"

import { useEffect, useState } from 'react'

export type SessionUser = { id: string; email: string }

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        if (!cancelled) {
          if (res.ok) {
            const data = await res.json()
            setUser(data.user)
          } else {
            setUser(null)
          }
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  return { user, loading, setUser }
}

