import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { BotaoCertificado } from './BotaoCertificado'

export default async function CursoPage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  const curso = await prisma.course.findUnique({
    where: { id: cursoId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              lessonProgresses: {
                where: { userId: user.id },
                select: { completedAt: true },
              },
            },
          },
        },
      },
    },
  })

  if (!curso) notFound()

  // Verificar acesso
  let temAcesso = perfil?.role === 'ADMIN'
  if (!temAcesso) {
    // Curso gratuito (preço = 0)
    if (Number(curso.price) === 0) {
      temAcesso = true
    } else {
      const acesso = await prisma.courseAccess.findFirst({
        where: { userId: user.id, courseId: cursoId },
      })
      const assinatura = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      })
      temAcesso = !!(acesso || assinatura)
    }
  }

  const totalAulas = curso.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  const aulasCompletas = curso.modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.lessonProgresses.length > 0).length,
    0
  )
  const progresso = totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '32px 20px' }}>

      <style>{`
        .curso-breadcrumb:hover { color: rgba(255,255,255,.7) !important; }
        .curso-aula-row:hover { background: rgba(91,200,255,.05) !important; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <Link href="/dashboard" className="curso-breadcrumb" style={{ color: 'rgba(255,255,255,.35)', fontSize: '13px', textDecoration: 'none' }}>
          ← Início
        </Link>
        {perfil?.role === 'ADMIN' && (
          <>
            <span style={{ color: 'rgba(255,255,255,.15)', fontSize: '13px' }}>/</span>
            <Link href={`/admin/cursos/${cursoId}/modulos`} style={{ color: '#5bc8ff', fontSize: '13px', textDecoration: 'none' }}>
              Editar no admin
            </Link>
          </>
        )}
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(91,200,255,.08) 0%, rgba(167,139,250,.06) 100%)',
        border: '1px solid rgba(255,255,255,.07)',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '200px', height: '200px',
          background: 'radial-gradient(ellipse, rgba(167,139,250,.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <span style={{
          display: 'inline-block',
          background: Number(curso.price) === 0 ? 'rgba(91,200,255,.12)' : 'rgba(167,139,250,.12)',
          border: `1px solid ${Number(curso.price) === 0 ? 'rgba(91,200,255,.25)' : 'rgba(167,139,250,.25)'}`,
          borderRadius: '20px', padding: '3px 12px', fontSize: '11px',
          color: Number(curso.price) === 0 ? '#5bc8ff' : '#a78bfa',
          fontFamily: 'var(--font-mono, monospace)', letterSpacing: '.06em',
          marginBottom: '14px',
        }}>
          {Number(curso.price) === 0 ? 'GRATUITO' : 'PREMIUM'}
        </span>

        <h1 style={{
          fontSize: '22px', fontWeight: 700, color: '#fff',
          lineHeight: 1.35, marginBottom: '10px',
          fontFamily: 'var(--font-h, sans-serif)',
        }}>{curso.title}</h1>

        {curso.description && (
          <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '13px', lineHeight: 1.7, marginBottom: '20px' }}>
            {curso.description}
          </p>
        )}

        {totalAulas > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.4)' }}>
                {aulasCompletas} de {totalAulas} aulas concluídas
              </span>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: progresso === 100 ? '#5bc8ff' : 'rgba(255,255,255,.5)',
                fontFamily: 'var(--font-mono, monospace)',
              }}>{progresso}%</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,.06)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                background: progresso === 100
                  ? 'linear-gradient(90deg, #5bc8ff, #a78bfa)'
                  : 'linear-gradient(90deg, #5bc8ff, #38bdf8)',
                width: `${progresso}%`,
                transition: 'width .4s ease',
              }} />
            </div>
            {progresso === 100 && temAcesso && (
              <div style={{ marginTop: '16px' }}>
                <BotaoCertificado cursoId={cursoId} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner de compra */}
      {!temAcesso && (
        <div style={{
          background: 'rgba(167,139,250,.07)',
          border: '1px solid rgba(167,139,250,.2)',
          borderRadius: '12px', padding: '28px',
          marginBottom: '24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,.4)', marginBottom: '4px' }}>
            Acesso necessário
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: '#fff', marginBottom: '16px', fontFamily: 'var(--font-h, sans-serif)' }}>
            R$ {Number(curso.price).toFixed(2).replace('.', ',')}
          </div>
          <form method="POST" action={`/api/checkout/${cursoId}`}>
            <button
              type="submit"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #5bc8ff, #a78bfa)',
                borderRadius: '8px', padding: '11px 32px',
                color: '#06040e', fontWeight: 700, fontSize: '14px',
                border: 'none', cursor: 'pointer',
              }}
            >
              Comprar acesso
            </button>
          </form>
        </div>
      )}

      {/* Módulos */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        opacity: temAcesso ? 1 : 0.45,
        pointerEvents: temAcesso ? 'auto' : 'none',
      }}>
        {curso.modules.map((modulo) => (
          <div key={modulo.id} style={{
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid rgba(255,255,255,.05)',
              background: 'rgba(255,255,255,.02)',
            }}>
              <div style={{ fontWeight: 600, color: 'rgba(255,255,255,.85)', fontSize: '14px' }}>
                {modulo.title}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', marginTop: '2px', fontFamily: 'var(--font-mono, monospace)' }}>
                {modulo.lessons.length} aula{modulo.lessons.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div>
              {modulo.lessons.map((aula, idx) => {
                const concluida = aula.lessonProgresses.length > 0
                return (
                  <Link
                    key={aula.id}
                    href={`/cursos/${cursoId}/aulas/${aula.id}`}
                    className="curso-aula-row"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '13px 20px', textDecoration: 'none',
                      borderBottom: idx < modulo.lessons.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none',
                      transition: 'background .15s',
                    }}
                  >
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: concluida ? 'linear-gradient(135deg, #5bc8ff, #38bdf8)' : 'rgba(255,255,255,.06)',
                      border: concluida ? 'none' : '1.5px solid rgba(255,255,255,.12)',
                    }}>
                      {concluida ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#06040e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="rgba(255,255,255,.4)" stroke="none">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      )}
                    </div>

                    <span style={{
                      fontSize: '13px', flex: 1,
                      color: concluida ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.75)',
                      textDecoration: concluida ? 'line-through' : 'none',
                    }}>
                      {aula.title}
                    </span>

                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
