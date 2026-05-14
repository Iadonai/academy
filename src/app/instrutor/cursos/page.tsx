import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function InstrutorCursosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cursos = await prisma.course.findMany({
    where: { instructorId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { courseAccesses: true, modules: true } } },
  })

  return (
    <div style={{ padding: '40px 48px', maxWidth: 960 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Meus Cursos</h1>
        <Link href="/instrutor/cursos/novo" style={{
          background: '#7c3aed', color: '#fff', borderRadius: 8,
          padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          + Novo curso
        </Link>
      </div>

      {cursos.length === 0 ? (
        <div style={{
          border: '2px dashed rgba(255,255,255,.1)', borderRadius: 12,
          padding: '60px 40px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
          <div style={{ color: 'rgba(255,255,255,.5)', fontSize: 14 }}>Você ainda não tem cursos.</div>
          <Link href="/instrutor/cursos/novo" style={{
            display: 'inline-block', marginTop: 16,
            background: '#7c3aed', color: '#fff', borderRadius: 8,
            padding: '10px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            Criar primeiro curso
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cursos.map((curso) => (
            <div key={curso.id} style={{
              background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              {curso.thumbnailUrl ? (
                <img src={curso.thumbnailUrl} alt="" style={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 80, height: 52, background: 'rgba(255,255,255,.06)', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: 14, marginBottom: 4 }}>{curso.title}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'rgba(255,255,255,.4)' }}>
                  <span>{curso._count.courseAccesses} aluno{curso._count.courseAccesses !== 1 ? 's' : ''}</span>
                  <span>{curso._count.modules} módulo{curso._count.modules !== 1 ? 's' : ''}</span>
                  <span>R$ {Number(curso.price).toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20,
                  background: curso.published ? 'rgba(74,222,128,.12)' : 'rgba(255,255,255,.06)',
                  color: curso.published ? '#4ade80' : 'rgba(255,255,255,.35)',
                  border: `1px solid ${curso.published ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.1)'}`,
                }}>
                  {curso.published ? 'PUBLICADO' : 'PENDENTE'}
                </span>
                <Link href={`/instrutor/cursos/${curso.id}`} style={{
                  fontSize: 12, color: '#5bc8ff', textDecoration: 'none',
                  padding: '6px 14px', border: '1px solid rgba(91,200,255,.25)', borderRadius: 6,
                }}>
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
