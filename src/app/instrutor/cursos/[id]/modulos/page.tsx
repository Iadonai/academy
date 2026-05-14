import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function adicionarModulo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cursoId = formData.get('cursoId') as string
  const curso = await prisma.course.findUnique({ where: { id: cursoId }, select: { instructorId: true } })
  if (curso?.instructorId !== user.id) redirect('/instrutor/cursos')

  const ultimo = await prisma.module.findFirst({ where: { courseId: cursoId }, orderBy: { order: 'desc' }, select: { order: true } })
  await prisma.module.create({
    data: { courseId: cursoId, title: formData.get('title') as string, order: (ultimo?.order ?? 0) + 1 },
  })
  revalidatePath(`/instrutor/cursos/${cursoId}/modulos`)
}

async function renomearModulo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const modulo = await prisma.module.findUnique({ where: { id }, select: { courseId: true, course: { select: { instructorId: true } } } })
  if (modulo?.course.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.module.update({ where: { id }, data: { title: formData.get('title') as string } })
  revalidatePath(`/instrutor/cursos/${modulo.courseId}/modulos`)
}

async function excluirModulo(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const modulo = await prisma.module.findUnique({ where: { id }, select: { courseId: true, course: { select: { instructorId: true } } } })
  if (modulo?.course.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.module.delete({ where: { id } })
  revalidatePath(`/instrutor/cursos/${modulo.courseId}/modulos`)
}

export default async function InstrutorModulosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const curso = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { lessons: true } } },
      },
    },
  })

  if (!curso || curso.instructorId !== user.id) notFound()

  const inputStyle = {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
    borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', flex: 1,
  }
  const btnStyle = (variant: 'primary' | 'ghost' | 'danger') => ({
    background: variant === 'primary' ? '#7c3aed' : variant === 'danger' ? 'rgba(239,68,68,.15)' : 'rgba(255,255,255,.06)',
    color: variant === 'danger' ? '#f87171' : '#fff',
    border: variant === 'danger' ? '1px solid rgba(239,68,68,.25)' : '1px solid rgba(255,255,255,.1)',
    borderRadius: 6, padding: '7px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
  })

  return (
    <div style={{ padding: '40px 48px', maxWidth: 760 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32 }}>
        <Link href="/instrutor/cursos" style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>← Cursos</Link>
        <span style={{ color: 'rgba(255,255,255,.15)' }}>/</span>
        <Link href={`/instrutor/cursos/${id}`} style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>{curso.title}</Link>
        <span style={{ color: 'rgba(255,255,255,.15)' }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>Módulos</span>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 24 }}>Módulos e Aulas</h1>

      {/* Adicionar módulo */}
      <div style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12, padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Novo módulo</div>
        <form action={adicionarModulo} style={{ display: 'flex', gap: 10 }}>
          <input type="hidden" name="cursoId" value={curso.id} />
          <input name="title" required placeholder="Ex: Introdução ao curso" style={inputStyle} />
          <button type="submit" style={btnStyle('primary')}>Adicionar</button>
        </form>
      </div>

      {/* Lista */}
      {curso.modules.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(255,255,255,.08)', borderRadius: 12,
          padding: '48px 40px', textAlign: 'center', color: 'rgba(255,255,255,.3)', fontSize: 13,
        }}>
          Nenhum módulo ainda. Adicione o primeiro acima.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {curso.modules.map((modulo) => (
            <div key={modulo.id} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', fontFamily: 'monospace', width: 20, textAlign: 'center', flexShrink: 0 }}>
                {modulo.order}
              </span>

              <form action={renomearModulo} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 0 }}>
                <input type="hidden" name="id" value={modulo.id} />
                <input name="title" defaultValue={modulo.title} required style={inputStyle} />
                <button type="submit" style={btnStyle('ghost')}>Salvar</button>
              </form>

              <Link href={`/instrutor/cursos/${id}/modulos/${modulo.id}/aulas`} style={{
                fontSize: 12, color: '#5bc8ff', textDecoration: 'none',
                padding: '7px 14px', border: '1px solid rgba(91,200,255,.25)', borderRadius: 6, flexShrink: 0,
              }}>
                {modulo._count.lessons} aula{modulo._count.lessons !== 1 ? 's' : ''} →
              </Link>

              <form action={excluirModulo}>
                <input type="hidden" name="id" value={modulo.id} />
                <button type="submit" style={btnStyle('danger')}>Excluir</button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
