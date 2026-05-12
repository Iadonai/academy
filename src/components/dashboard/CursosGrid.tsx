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
          display: 'flex', flexDirection: 'column',
          background: 'var(--s2)', border: '1px solid var(--bdr)',
          overflow: 'hidden', textDecoration: 'none',
          transition: 'border-color .2s, transform .2s, box-shadow .2s',
          opacity: curso.temAcesso ? 1 : 0.9,
        }}
        onMouseEnter={e => {
          const el = e.currentTarget
          el.style.borderColor = 'var(--b3)'
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 12px 32px rgba(91,200,255,.08)'
          const img = el.querySelector('img')
          if (img) img.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget
          el.style.borderColor = 'var(--bdr)'
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
          const img = el.querySelector('img')
          if (img) img.style.transform = 'scale(1)'
        }}
      >
        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
          {curso.thumbnailUrl ? (
            <img
              src={curso.thumbnailUrl}
              alt={curso.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .5s cubic-bezier(.16,1,.3,1)' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', background: 'var(--s3)',
              backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(91,200,255,.03) 9px,rgba(91,200,255,.03) 10px),repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(91,200,255,.03) 9px,rgba(91,200,255,.03) 10px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: 'var(--font-h)', fontSize: 52, color: 'var(--cy)', opacity: .2 }}>
                {curso.title.charAt(0)}
              </span>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(to top, rgba(0,0,0,.6), transparent)', pointerEvents: 'none' }} />

          {Number(curso.price) === 0 && (
            <div style={{
              position: 'absolute', top: 8, left: 8,
              background: 'rgba(34,197,94,.9)', color: '#fff',
              fontFamily: 'var(--font-m)', fontSize: 9, padding: '2px 8px', letterSpacing: '.1em',
            }}>GRÁTIS</div>
          )}

          {curso.progresso === 100 && (
            <div style={{
              position: 'absolute', top: 8, right: isAdmin ? 36 : 8,
              background: 'rgba(91,200,255,.2)', border: '1px solid rgba(91,200,255,.5)',
              color: 'var(--cy)', fontFamily: 'var(--font-m)', fontSize: 9, padding: '2px 8px', letterSpacing: '.08em',
            }}>✓ CONCLUÍDO</div>
          )}

          {isAdmin && (
            <div
              {...attributes} {...listeners}
              onClick={e => e.preventDefault()}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.2)',
                color: 'rgba(255,255,255,.7)', fontSize: 14, padding: '3px 7px',
                cursor: isDragging ? 'grabbing' : 'grab', zIndex: 10,
              }}
            >⠿</div>
          )}

          {!curso.temAcesso && Number(curso.price) > 0 && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 28 }}>🔒</span>
              <span style={{ fontFamily: 'var(--font-h)', fontSize: 13, color: '#fff', letterSpacing: '.04em' }}>
                R$ {Number(curso.price).toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--cy)', letterSpacing: '.14em' }}>// CURSO</div>
          <div style={{
            fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: 13, lineHeight: 1.45, color: 'var(--tx)',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {curso.title}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--mt)', marginBottom: 5 }}>
              <span>{curso.concluidas}/{curso.total} aulas</span>
              <span style={{ color: curso.progresso > 0 ? 'var(--cy)' : 'var(--mt)' }}>{curso.progresso}%</span>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${curso.progresso}%` }} />
            </div>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
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
