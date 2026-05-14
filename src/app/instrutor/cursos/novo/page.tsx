import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function criarCursoInstrutor(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (perfil?.role !== 'INSTRUCTOR' && perfil?.role !== 'ADMIN') redirect('/dashboard')

  const curso = await prisma.course.create({
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || 0,
      published: false,
      instructorId: user.id,
      revenueShare: 0.50,
    },
  })

  redirect(`/instrutor/cursos/${curso.id}`)
}

export default function NovoCursoInstrutorPage() {
  return (
    <div style={{ padding: '40px 48px', maxWidth: 640 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 32 }}>Novo Curso</h1>

      <form action={criarCursoInstrutor} style={{
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>Título do curso</label>
          <input name="title" required placeholder="Ex: Power BI do Zero ao Avançado"
            style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
            }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>Descrição</label>
          <textarea name="description" required rows={4} placeholder="O que o aluno vai aprender..."
            style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
              outline: 'none', resize: 'vertical',
            }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,.7)' }}>Preço (R$)</label>
          <input name="price" type="number" min="0" step="0.01" defaultValue="49.00"
            style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
            }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
            Você recebe 50% por venda. A IADONAI cuida da plataforma, pagamentos e suporte.
          </span>
        </div>

        <button type="submit" style={{
          background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
          padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start',
        }}>
          Criar curso
        </button>
      </form>
    </div>
  )
}
