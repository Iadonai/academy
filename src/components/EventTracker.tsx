'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
  }
}

export function EventTracker() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const ev = searchParams.get('_ev')
    if (!ev) return

    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event: ev })

    const params = new URLSearchParams(searchParams.toString())
    params.delete('_ev')
    const newUrl = params.size ? `${pathname}?${params.toString()}` : pathname
    router.replace(newUrl, { scroll: false })
  }, [searchParams, router, pathname])

  return null
}
