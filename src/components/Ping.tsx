'use client'

import { useEffect } from 'react'

export function Ping() {
  useEffect(() => {
    const ping = () => fetch('/api/me/ping', { method: 'POST' })
    ping()
    const id = setInterval(ping, 60_000)
    return () => clearInterval(id)
  }, [])

  return null
}
