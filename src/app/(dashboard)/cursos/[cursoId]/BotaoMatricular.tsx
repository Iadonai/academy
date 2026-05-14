'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BotaoMatricular({ cursoId }: { cursoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function matricular() {
    setLoading(true)
    const res = await fetch('/api/checkout/matricular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursoId }),
    })
    const data = await res.json()
    if (data.redirect) router.push(data.redirect)
    else setLoading(false)
  }

  return (
    <button
      onClick={matricular}
      disabled={loading}
      style={{
        width: '100%',
        background: loading ? 'rgba(91,200,255,.1)' : 'linear-gradient(135deg, #5bc8ff, #38bdf8)',
        border: 'none', borderRadius: '8px', padding: '14px',
        color: loading ? 'rgba(255,255,255,.4)' : '#06040e',
        fontWeight: 700, fontSize: '15px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-h, sans-serif)',
      }}
    >
      {loading ? 'MATRICULANDO...' : 'MATRICULAR-SE GRATUITAMENTE →'}
    </button>
  )
}
