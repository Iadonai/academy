'use client'

import { useState, useEffect, useRef } from 'react'
import { salvarNota } from '@/app/actions/notas'

interface Props {
  lessonId: string
  conteudoInicial: string
}

export function NotasPessoais({ lessonId, conteudoInicial }: Props) {
  const [texto, setTexto] = useState(conteudoInicial)
  const [status, setStatus] = useState<'idle' | 'salvando' | 'salvo'>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (texto === conteudoInicial) return

    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus('salvando')

    timerRef.current = setTimeout(async () => {
      await salvarNota(lessonId, texto)
      setStatus('salvo')
      setTimeout(() => setStatus('idle'), 2000)
    }, 1200)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [texto])

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px' }}>📝</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Minhas anotações</span>
        </div>
        <span style={{
          fontSize: '11px',
          color: status === 'salvo' ? '#22c55e' : status === 'salvando' ? '#94a3b8' : 'transparent',
          transition: 'color .2s',
        }}>
          {status === 'salvando' ? 'Salvando...' : status === 'salvo' ? '✓ Salvo' : '·'}
        </span>
      </div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Anote aqui suas dúvidas, insights ou pontos importantes desta aula..."
        rows={5}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '13px',
          lineHeight: 1.6,
          color: '#334155',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          resize: 'vertical',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={(e) => { e.target.style.borderColor = '#3b82f6' }}
        onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
      />
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
        Salvo automaticamente · Visível só para você
      </div>
    </div>
  )
}
