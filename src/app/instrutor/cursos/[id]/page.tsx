import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function salvarCursoInstrutor(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = formData.get('id') as string
  const curso = await prisma.course.findUnique({ where: { id }, select: { instructorId: true } })
  if (curso?.instructorId !== user.id) redirect('/instrutor/cursos')

  await prisma.course.update({
    where: { id },
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || 0,
    },
  })

  revalidatePath('/instrutor/cursos')
  redirect(`/instrutor/cursos/${id}/modulos`)
}

export default async function InstrutorCursoEditarPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const curso = await prisma.course.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, price: true, published: true, instructorId: true, revenueShare: true },
  })

  if (!curso || curso.instructorId !== user.id) notFound()

  return (
    <div style={{ padding: '40px 48px', maxWidth: 640 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32 }}>
        <Link href="/instrutor/cursos" style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', textDecoration: 'none' }}>← Cursos</Link>
        <span style={{ color: 'rgba(255,255,255,.15)' }}>/</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)' }}>{curso.title}</span>
      </div>

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Editar Curso</h1>

      {!curso.published && (
        <div style={{
          background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)',
          borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 12, color: '#fbbf24',
        }}>
          ⏳ Seu curso está aguardando aprovação da IADONAI para ser publicado.
        </div>
      )}

      <form action={salvarCursoInstrutor} style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20,
      }}>
        <input type="hidden" name="id" value={curso.id} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>Título</label>
          <input name="title" required defaultValue={curso.title}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>Descrição</label>
          <textarea name="description" required rows={4} defaultValue={curso.description}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>Preço (R$)</label>
          <input name="price" type="number" min="0" step="0.01" defaultValue={Number(curso.price).toFixed(2)}
            style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
            Sua parte: {Number(curso.revenueShare) * 100}% por venda
          </span>
        </div>

        <button type="submit" style={{
          background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
        }}>
          Salvar e ir para módulos →
        </button>
      </form>

      <Link href={`/instrutor/cursos/${id}/modulos`} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        color: '#5bc8ff', fontSize: 13, textDecoration: 'none',
      }}>
        Gerenciar módulos e aulas →
      </Link>
    </div>
  )
}
