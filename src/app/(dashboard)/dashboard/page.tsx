import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function buscarFrase(): Promise<{ texto: string; autor: string } | null> {
  try {
    const res = await fetch('https://zenquotes.io/api/random', { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = await res.json()
    return { texto: data[0]?.q ?? '', autor: data[0]?.a ?? '' }
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, xpTotal: true, level: true, role: true },
  })

  const isAdmin = perfil?.role === 'ADMIN'

  // Busca todos os cursos publicados
  const todosCursos = await prisma.course.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, description: true, thumbnailUrl: true, price: true, kiwifyCheckoutUrl: true, _count: { select: { modules: true } } },
  })

  // IDs com acesso direto
  const assinatura = await prisma.subscription.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
  })
  const acessos = await prisma.courseAccess.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  })
  const idsComAcesso = new Set(acessos.map((a) => a.courseId))

  const cursos = todosCursos.map((c) => ({
    ...c,
    temAcesso: isAdmin || !!assinatura || Number(c.price) === 0 || idsComAcesso.has(c.id),
  }))

  const progresses = await prisma.lessonProgress.findMany({
    where: { userId: user.id },
    select: { lessonId: true },
  })
  const idsConcluidasSet = new Set(progresses.map((p) => p.lessonId))

  const cursosComProgresso = await Promise.all(
    cursos.map(async (curso) => {
      const todasAulas = await prisma.lesson.findMany({
        where: { module: { courseId: curso.id } },
        select: { id: true },
      })
      const total = todasAulas.length
      const concluidas = todasAulas.filter((a) => idsConcluidasSet.has(a.id)).length
      const progresso = total > 0 ? Math.round((concluidas / total) * 100) : 0
      return { ...curso, total, concluidas, progresso }
    })
  )

  const [frase] = await Promise.all([buscarFrase()])

  const primeiroNome = perfil?.name?.split(' ')[0] ?? 'ALUNO'
  const concluidos = cursosComProgresso.filter((c) => c.progresso === 100).length

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner">
        <div style={{ position: 'relative' }}>
          <div style={{
            fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)',
            background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)',
            padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block',
          }}>
            // CLASSROOM
          </div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em', marginBottom: '6px' }}>
            BEM-VINDO, {primeiroNome.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', letterSpacing: '.02em' }}>
            {cursosComProgresso.length} {cursosComProgresso.length === 1 ? 'curso disponível' : 'cursos disponíveis'}
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
            <div>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{perfil?.xpTotal ?? 0}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// XP TOTAL</div>
            </div>
            <div>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{perfil?.level ?? 1}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// NÍVEL</div>
            </div>
            <div>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{concluidos}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// CONCLUÍDOS</div>
            </div>
          </div>
        </div>
        <div className="hero-hex">IA</div>
      </div>

      {/* Frase do dia */}
      {frase && (
        <div style={{ margin: '16px 0', padding: '14px 18px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em', marginBottom: '6px' }}>// FRASE DO DIA</div>
          <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.6, fontStyle: 'italic' }}>"{frase.texto}"</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: '6px', letterSpacing: '.04em' }}>— {frase.autor}</div>
        </div>
      )}

      {/* Grid de cursos */}
      <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '14px' }}>
        // MEUS_CURSOS
      </div>

      {cursosComProgresso.length === 0 ? (
        <div style={{
          background: 'var(--s2)', border: '1px dashed var(--bdr)',
          padding: '48px 20px', textAlign: 'center',
        }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>
            {isAdmin ? 'NENHUM CURSO PUBLICADO. CRIE NO ADMIN.' : 'NENHUM CURSO DISPONÍVEL.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {cursosComProgresso.map((curso) => (
            <Link key={curso.id} href={`/cursos/${curso.id}`} className="course-card" style={{ opacity: curso.temAcesso ? 1 : 0.85 }}>
              {/* Thumb */}
              <div style={{ height: '110px', background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                {curso.thumbnailUrl ? (
                  <img src={curso.thumbnailUrl} alt={curso.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 9px,rgba(91,200,255,.03) 9px,rgba(91,200,255,.03) 10px),repeating-linear-gradient(90deg,transparent,transparent 9px,rgba(91,200,255,.03) 9px,rgba(91,200,255,.03) 10px)',
                    }} />
                    <span style={{ fontFamily: 'var(--font-h)', fontSize: '32px', color: 'var(--cy)', opacity: .3, position: 'relative' }}>
                      {curso.title.charAt(0)}
                    </span>
                  </>
                )}
                {curso.progresso === 100 && (
                  <div style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'rgba(91,200,255,.15)', border: '1px solid rgba(91,200,255,.4)',
                    color: 'var(--cy)', fontFamily: 'var(--font-m)', fontSize: '9px',
                    padding: '2px 7px', letterSpacing: '.08em',
                  }}>CONCLUÍDO</div>
                )}
                {!curso.temAcesso && Number(curso.price) > 0 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,.45)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  }}>
                    <span style={{ fontSize: '28px', lineHeight: 1 }}>🔒</span>
                  </div>
                )}
                {Number(curso.price) === 0 && (
                  <div style={{
                    position: 'absolute', top: '8px', left: '8px',
                    background: 'rgba(34,197,94,.15)', border: '1px solid rgba(34,197,94,.4)',
                    color: '#22c55e', fontFamily: 'var(--font-m)', fontSize: '9px',
                    padding: '2px 7px', letterSpacing: '.08em',
                  }}>GRÁTIS</div>
                )}
              </div>
              {/* Accent bar */}
              <div style={{ height: '2px', background: 'var(--cy)' }} />
              {/* Info */}
              <div style={{ padding: '10px 12px' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  // CURSO
                </div>
                <div className="post-title" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.3, marginBottom: '6px' }}>
                  {curso.title}
                </div>
                {!curso.temAcesso && Number(curso.price) > 0 && (
                  <div style={{
                    fontFamily: 'var(--font-h)', fontSize: '13px', fontWeight: 700,
                    color: 'var(--mg)', letterSpacing: '.04em', marginBottom: '6px',
                  }}>
                    🔒 R$ {Number(curso.price).toFixed(2).replace('.', ',')}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }}>
                  <span>{curso.concluidas}/{curso.total} aulas</span>
                  <span style={{ color: 'var(--cy)' }}>{curso.progresso}%</span>
                </div>
                <div className="prog-track">
                  <div className="prog-fill" style={{ width: `${curso.progresso}%` }} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
