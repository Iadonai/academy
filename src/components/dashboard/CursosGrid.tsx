'use client'

import Link from 'next/link'
import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Curso = {
  id: string
  title: string
  thumbnailUrl: string | null
  price: string | number
  temAcesso: boolean
  progresso: number
  concluidas: number
  total: number
}

function CardCurso({ curso, isAdmin }: { curso: Curso; isAdmin: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: curso.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
    >
      <Link
        href={`/cursos/${curso.id}`}
        style={{
          display: 'block', position: 'relative',
          aspectRatio: '2/3', overflow: 'hidden',
          borderRadius: 10, textDecoration: 'none',
          border: '1px solid rgba(255,255,255,.06)',
          transition: 'transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s cubic-bezier(.16,1,.3,1)',
          opacity: curso.temAcesso ? 1 : 0.85,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.transform = 'scale(1.04) translateY(-4px)'
          el.style.boxShadow = '0 20px 50px rgba(91,200,255,.18), 0 0 0 1px rgba(91,200,255,.25)'
          const img = el.querySelector('img')
          if (img) img.style.transform = 'scale(1.08)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.transform = 'scale(1) translateY(0)'
          el.style.boxShadow = 'none'
          const img = el.querySelector('img')
          if (img) img.style.transform = 'scale(1)'
        }}
      >
        {/* Imagem de fundo full */}
        {curso.thumbnailUrl ? (
          <img
            src={curso.thumbnailUrl}
            alt={curso.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s cubic-bezier(.16,1,.3,1)' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1030 0%, #0d0d1f 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: 64, color: 'var(--cy)', opacity: .15 }}>
              {curso.title.charAt(0)}
            </span>
          </div>
        )}

        {/* Gradiente inferior para legibilidade do título */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.4) 45%, rgba(0,0,0,.05) 100%)', pointerEvents: 'none' }} />

        {/* Badge GRÁTIS */}
        {Number(curso.price) === 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: '#22c55e', color: '#fff',
            fontFamily: 'var(--font-m)', fontSize: 9, fontWeight: 700,
            padding: '3px 9px', letterSpacing: '.1em', borderRadius: 3,
          }}>GRÁTIS</div>
        )}

        {/* Badge CONCLUÍDO */}
        {curso.progresso === 100 && (
          <div style={{
            position: 'absolute', top: 10, right: isAdmin ? 38 : 10,
            background: 'rgba(91,200,255,.15)', border: '1px solid rgba(91,200,255,.45)',
            color: 'var(--cy)', fontFamily: 'var(--font-m)', fontSize: 9,
            padding: '3px 9px', letterSpacing: '.08em', borderRadius: 3,
          }}>✓ CONCLUÍDO</div>
        )}

        {/* Handle drag (admin) */}
        {isAdmin && (
          <div
            {...attributes} {...listeners}
            onClick={e => e.preventDefault()}
            style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.2)',
              color: 'rgba(255,255,255,.7)', fontSize: 14, padding: '3px 7px', borderRadius: 4,
              cursor: isDragging ? 'grabbing' : 'grab', zIndex: 10,
            }}
          >⠿</div>
        )}

        {/* Overlay cadeado */}
        {!curso.temAcesso && Number(curso.price) > 0 && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 32 }}>🔒</span>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: 14, color: '#fff', letterSpacing: '.04em' }}>
              R$ {Number(curso.price).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        {/* Info no rodapé */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 14px 14px' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--cy)', letterSpacing: '.14em', marginBottom: 5 }}>// CURSO</div>
          <div style={{
            fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: 13, lineHeight: 1.4, color: '#fff',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: 10,
          }}>
            {curso.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.55)', marginBottom: 5 }}>
            <span>{curso.concluidas}/{curso.total} aulas</span>
            <span style={{ color: curso.progresso > 0 ? 'var(--cy)' : 'rgba(255,255,255,.4)' }}>{curso.progresso}%</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${curso.progresso}%` }} />
          </div>
        </div>
      </Link>
    </div>
  )
}

export function CursosGrid({ cursos: inicial, isAdmin }: { cursos: Curso[]; isAdmin: boolean }) {
  const [cursos, setCursos] = useState(inicial)
  const [salvando, setSalvando] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const salvarOrdem = useCallback(async (lista: Curso[]) => {
    setSalvando(true)
    try {
      await fetch('/api/admin/cursos/ordem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordem: lista.map((c) => c.id) }),
      })
    } finally {
      setSalvando(false)
    }
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = cursos.findIndex((c) => c.id === active.id)
    const newIndex = cursos.findIndex((c) => c.id === over.id)
    const nova = arrayMove(cursos, oldIndex, newIndex)
    setCursos(nova)
    salvarOrdem(nova)
  }

  const grid = (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '14px' }}>
      {cursos.map((curso) => (
        <CardCurso key={curso.id} curso={curso} isAdmin={isAdmin} />
      ))}
    </div>
  )

  if (!isAdmin) return grid

  return (
    <div>
      {salvando && (
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.08em', marginBottom: '8px' }}>
          // SALVANDO ORDEM...
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cursos.map((c) => c.id)} strategy={rectSortingStrategy}>
          {grid}
        </SortableContext>
      </DndContext>
    </div>
  )
}
