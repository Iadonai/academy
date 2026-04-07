'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { registrarPomodoro } from '@/app/actions/pomodoro'

type Modo = 'foco' | 'pausa' | 'pausa-longa'

const TEMPOS: Record<Modo, number> = {
  foco: 25 * 60,
  pausa: 5 * 60,
  'pausa-longa': 15 * 60,
}

const LABELS: Record<Modo, string> = {
  foco: 'FOCO',
  pausa: 'PAUSA',
  'pausa-longa': 'PAUSA LONGA',
}

const CORES: Record<Modo, string> = {
  foco: 'var(--cy)',
  pausa: '#22c55e',
  'pausa-longa': '#a855f7',
}

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
  } catch {}
}

export function PomodoroWidget({ lessonId }: { lessonId: string }) {
  const [aberto, setAberto] = useState(false)
  const [modo, setModo] = useState<Modo>('foco')
  const [segundos, setSegundos] = useState(TEMPOS['foco'])
  const [rodando, setRodando] = useState(false)
  const [sessoes, setSessoes] = useState(0)
  const [xpGanho, setXpGanho] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = TEMPOS[modo]
  const progresso = ((total - segundos) / total) * 100
  const min = String(Math.floor(segundos / 60)).padStart(2, '0')
  const sec = String(segundos % 60).padStart(2, '0')

  const trocarModo = useCallback((novoModo: Modo) => {
    setModo(novoModo)
    setSegundos(TEMPOS[novoModo])
    setRodando(false)
  }, [])

  const completar = useCallback(async () => {
    beep()
    setRodando(false)
    if (modo === 'foco') {
      const novasSessoes = sessoes + 1
      setSessoes(novasSessoes)
      try {
        const xp = await registrarPomodoro(lessonId)
        setXpGanho((prev) => prev + xp)
      } catch {}
      trocarModo(novasSessoes % 4 === 0 ? 'pausa-longa' : 'pausa')
    } else {
      trocarModo('foco')
    }
  }, [modo, sessoes, lessonId, trocarModo])

  useEffect(() => {
    if (rodando) {
      intervalRef.current = setInterval(() => {
        setSegundos((s) => {
          if (s <= 1) { completar(); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [rodando, completar])

  const cor = CORES[modo]

  // Círculo SVG
  const raio = 54
  const circunferencia = 2 * Math.PI * raio
  const dash = circunferencia - (progresso / 100) * circunferencia

  return (
    <>
      {/* Botão flutuante */}
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          title="Modo Foco (Pomodoro)"
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'var(--s2)', border: '1px solid var(--cy)',
            color: 'var(--cy)', fontSize: '22px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(91,200,255,.2)',
          }}
        >
          🍅
        </button>
      )}

      {/* Widget expandido */}
      {aberto && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
          width: '240px',
          background: 'var(--bg)', border: `1px solid ${cor}`,
          boxShadow: `0 0 24px color-mix(in srgb, ${cor} 20%, transparent)`,
          padding: '16px',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: cor, letterSpacing: '.12em' }}>
              🍅 MODO FOCO
            </div>
            <button
              onClick={() => { setAberto(false); setRodando(false) }}
              style={{ background: 'none', border: 'none', color: 'var(--mt)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
            >×</button>
          </div>

          {/* Seletor de modo */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {(['foco', 'pausa', 'pausa-longa'] as Modo[]).map((m) => (
              <button
                key={m}
                onClick={() => trocarModo(m)}
                style={{
                  flex: 1, padding: '3px 0',
                  fontFamily: 'var(--font-m)', fontSize: '7px', letterSpacing: '.06em',
                  background: modo === m ? `color-mix(in srgb, ${CORES[m]} 15%, transparent)` : 'transparent',
                  border: `1px solid ${modo === m ? CORES[m] : 'var(--bdr)'}`,
                  color: modo === m ? CORES[m] : 'var(--mt)',
                  cursor: 'pointer',
                }}
              >
                {LABELS[m]}
              </button>
            ))}
          </div>

          {/* Timer circular */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '128px', height: '128px' }}>
              <svg width="128" height="128" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="64" cy="64" r={raio} fill="none" stroke="var(--s2)" strokeWidth="6" />
                <circle
                  cx="64" cy="64" r={raio} fill="none"
                  stroke={cor} strokeWidth="6"
                  strokeDasharray={circunferencia}
                  strokeDashoffset={dash}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset .5s, stroke .3s' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-h)', fontSize: '28px', color: cor, letterSpacing: '.04em', lineHeight: 1 }}>
                  {min}:{sec}
                </div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '8px', color: 'var(--mt)', letterSpacing: '.1em', marginTop: '2px' }}>
                  {LABELS[modo]}
                </div>
              </div>
            </div>

            {/* Controles */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => { setSegundos(TEMPOS[modo]); setRodando(false) }}
                style={{ padding: '6px 10px', background: 'transparent', border: '1px solid var(--bdr)', color: 'var(--mt)', fontFamily: 'var(--font-m)', fontSize: '9px', cursor: 'pointer' }}
              >↺</button>
              <button
                onClick={() => setRodando((r) => !r)}
                style={{
                  padding: '8px 20px',
                  background: `color-mix(in srgb, ${cor} 12%, transparent)`,
                  border: `1px solid ${cor}`,
                  color: cor, fontFamily: 'var(--font-m)', fontSize: '10px',
                  letterSpacing: '.1em', cursor: 'pointer',
                }}
              >
                {rodando ? 'PAUSAR' : 'INICIAR'}
              </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', borderTop: '1px solid var(--bdr)', width: '100%', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '16px' }}>{sessoes}</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '8px', color: 'var(--mt)', letterSpacing: '.06em' }}>SESSÕES</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '16px', color: '#22c55e' }}>+{xpGanho}</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '8px', color: 'var(--mt)', letterSpacing: '.06em' }}>XP GANHO</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
