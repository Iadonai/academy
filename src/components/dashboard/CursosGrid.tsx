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
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <Link href={`/cursos/${curso.id}`} className="course-card" style={{
        opacity: curso.temAcesso ? 1 : 0.85,
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '16/10',
        display: 'block',
      }}>
        {curso.thumbnailUrl ? (
          <img src={curso.thumbnailUrl} alt={curso.title}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, background: 'var(--s3)',
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(91,200,255,.03) 9px,rgba(91,200,255,.03) 10px),repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(91,200,255,.03) 9px,rgba(91,200,255,.03) 10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: '48px', color: 'var(--cy)', opacity: .3 }}>
              {curso.title.charAt(0)}
            </span>
          </div>
        )}

        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.85) 0%, rgba(0,0,0,.3) 50%, transparent 100%)' }} />

        {Number(curso.price) === 0 && (
          <div style={{
            position: 'absolute', top: '8px', left: '8px',
            background: 'rgba(34,197,94,.2)', border: '1px solid rgba(34,197,94,.5)',
            color: '#22c55e', fontFamily: 'var(--font-m)', fontSize: '9px',
            padding: '2px 7px', letterSpacing: '.08em',
          }}>GRÁTIS</div>
        )}
        {curso.progresso === 100 && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(91,200,255,.15)', border: '1px solid rgba(91,200,255,.4)',
            color: 'var(--cy)', fontFamily: 'var(--font-m)', fontSize: '9px',
            padding: '2px 7px', letterSpacing: '.08em',
          }}>CONCLUÍDO</div>
        )}

        {isAdmin && (
          <div
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
            style={{
              position: 'absolute', top: '8px', right: curso.progresso === 100 ? '80px' : '8px',
              background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.15)',
              color: 'rgba(255,255,255,.6)', fontSize: '14px', padding: '3px 7px',
              cursor: isDragging ? 'grabbing' : 'grab', zIndex: 10,
            }}
          >⠿</div>
        )}

        {!curso.temAcesso && Number(curso.price) > 0 && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
            <span style={{ fontSize: '32px', lineHeight: 1 }}>🔒</span>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: '13px', color: 'var(--mg)', letterSpacing: '.04em' }}>
              R$ {Number(curso.price).toFixed(2).replace('.', ',')}
            </span>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 12px' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.12em', marginBottom: '3px' }}>// CURSO</div>
          <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.3, color: '#fff', marginBottom: '6px' }}>
            {curso.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-m)', fontSize: '10px', color: 'rgba(255,255,255,.6)', marginBottom: '4px' }}>
            <span>{curso.concluidas}/{curso.total} aulas</span>
            <span style={{ color: 'var(--cy)' }}>{curso.progresso}%</span>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
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
