import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { CursosGrid } from '@/components/dashboard/CursosGrid'

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
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
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
        <CursosGrid
          cursos={cursosComProgresso.map((c) => ({ ...c, price: String(c.price) }))}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
