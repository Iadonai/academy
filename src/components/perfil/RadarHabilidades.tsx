'use client'

import { useEffect, useRef, useState } from 'react'

interface Habilidade {
  nome: string
  valor: number // 0-100
  cor: string
}

interface Props {
  habilidades: Habilidade[]
}

export function RadarHabilidades({ habilidades }: Props) {
  const [animado, setAnimado] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimado(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const tamanho = 260
  const centro = tamanho / 2
  const raio = 100
  const n = habilidades.length
  if (n < 3) return null

  const angulo = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2

  const ponto = (i: number, pct: number) => {
    const r = raio * pct
    return {
      x: centro + r * Math.cos(angulo(i)),
      y: centro + r * Math.sin(angulo(i)),
    }
  }

  // Linhas da grade (5 níveis)
  const grades = [0.2, 0.4, 0.6, 0.8, 1.0]

  // Polígono de fundo da grade
  const gradePoligono = (pct: number) =>
    Array.from({ length: n }, (_, i) => ponto(i, pct))
      .map((p) => `${p.x},${p.y}`)
      .join(' ')

  // Polígono dos valores reais (animado)
  const valorPoligono = Array.from({ length: n }, (_, i) =>
    ponto(i, animado ? (habilidades[i].valor / 100) : 0)
  )
    .map((p) => `${p.x},${p.y}`)
    .join(' ')

  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <svg width={tamanho} height={tamanho} style={{ overflow: 'visible' }}>
        {/* Grade */}
        {grades.map((pct) => (
          <polygon
            key={pct}
            points={gradePoligono(pct)}
            fill="none"
            stroke="rgba(91,200,255,.1)"
            strokeWidth="1"
          />
        ))}

        {/* Eixos */}
        {Array.from({ length: n }, (_, i) => {
          const p = ponto(i, 1)
          return (
            <line
              key={i}
              x1={centro} y1={centro}
              x2={p.x} y2={p.y}
              stroke="rgba(91,200,255,.1)"
              strokeWidth="1"
            />
          )
        })}

        {/* Polígono de valores */}
        <polygon
          points={valorPoligono}
          fill="rgba(91,200,255,.12)"
          stroke="rgba(91,200,255,.7)"
          strokeWidth="1.5"
          style={{ transition: 'all 1s ease-out' }}
        />

        {/* Pontos nos vértices */}
        {Array.from({ length: n }, (_, i) => {
          const p = ponto(i, animado ? habilidades[i].valor / 100 : 0)
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y} r="4"
              fill={habilidades[i].cor}
              stroke="var(--bg)"
              strokeWidth="1.5"
              style={{ transition: `all 1s ease-out ${i * 0.05}s` }}
            />
          )
        })}

        {/* Labels */}
        {Array.from({ length: n }, (_, i) => {
          const p = ponto(i, 1.28)
          const valor = habilidades[i].valor
          return (
            <g key={i}>
              <text
                x={p.x} y={p.y - 4}
                textAnchor="middle"
                fill={habilidades[i].cor}
                fontSize="9"
                fontFamily="monospace"
                letterSpacing="1"
              >
                {habilidades[i].nome.toUpperCase()}
              </text>
              <text
                x={p.x} y={p.y + 10}
                textAnchor="middle"
                fill="rgba(255,255,255,.5)"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {valor}%
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legenda */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
        {habilidades.map((h) => (
          <div key={h.nome} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: h.cor }} />
            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--mt)' }}>{h.nome}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
