'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CartItem {
  id: string
  title: string
  price: string
  thumbnailUrl: string | null
}

const STORAGE_KEY = 'iadonai_cart'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setHydrated(true)
  }, [])

  const save = useCallback((next: CartItem[]) => {
    setItems(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }, [])

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev
      const next = [...prev, item]
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    save(items.filter(i => i.id !== id))
  }, [items, save])

  const hasItem = useCallback((id: string) => items.some(i => i.id === id), [items])

  const clear = useCallback(() => save([]), [save])

  const total = items.reduce((acc, item) => acc + Number(item.price), 0)

  return { items, addItem, removeItem, hasItem, clear, total, hydrated }
}
