'use client'

import { useState } from 'react'

export function BotaoCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button
      onClick={copiar}
      className="text-xs px-3 py-1.5 rounded font-medium transition-colors"
      style={{
        background: copiado ? '#d1fae5' : '#f1f5f9',
        color: copiado ? '#065f46' : '#475569',
      }}
    >
      {copiado ? '✅ COPIADO' : 'COPIAR'}
    </button>
  )
}
