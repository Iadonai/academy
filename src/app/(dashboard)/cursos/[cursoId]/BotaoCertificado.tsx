'use client'

import { useState } from 'react'
import { gerarCertificado } from '@/app/actions/certificado'

export function BotaoCertificado({ cursoId }: { cursoId: string }) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleClick() {
    setCarregando(true)
    setErro('')
    try {
      const id = await gerarCertificado(cursoId)
      window.open(`/certificado/${id}`, '_blank')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao gerar certificado')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div style={{ marginTop: '8px' }}>
      <button
        onClick={handleClick}
        disabled={carregando}
        style={{
          padding: '10px 24px',
          fontFamily: 'var(--font-m)',
          fontSize: '11px',
          letterSpacing: '.1em',
          color: '#22c55e',
          border: '1px solid rgba(34,197,94,.5)',
          background: 'rgba(34,197,94,.08)',
          cursor: carregando ? 'wait' : 'pointer',
          opacity: carregando ? .6 : 1,
        }}
      >
        {carregando ? 'GERANDO...' : '🎓 BAIXAR CERTIFICADO'}
      </button>
      {erro && (
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: '#ef4444', marginTop: '6px' }}>
          {erro}
        </div>
      )}
    </div>
  )
}
