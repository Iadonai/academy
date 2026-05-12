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

  const bannerConfigs = await prisma.platformConfig.findMany({
    where: { key: { in: ['hero_banner_url', 'hero_banner_link'] } },
  })
  const bannerMap = Object.fromEntries(bannerConfigs.map(c => [c.key, c.value]))
  const bannerUrl = bannerMap['hero_banner_url'] ?? null
  const bannerLink = bannerMap['hero_banner_link'] ?? null

  const [frase] = await Promise.all([buscarFrase()])

  const primeiroNome = perfil?.name?.split(' ')[0] ?? 'ALUNO'
  const concluidos = cursosComProgresso.filter((c) => c.progresso === 100).length

  return (
    <div style={{ padding: '0 0 24px' }}>

      {/* ── BANNER GRANDE NO TOPO ── */}
      {bannerUrl ? (
        bannerLink ? (
          <a href={bannerLink} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="Banner" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          </a>
        ) : (
          <div style={{ width: '100%', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bannerUrl} alt="Banner" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          </div>
        )
      ) : (
        <div style={{
          width: '100%', height: 200,
          background: 'linear-gradient(135deg, var(--s2) 0%, rgba(91,200,255,.06) 100%)',
          border: '1px dashed var(--bdr)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <div style={{ fontFamily: 'var(--font-h)', fontSize: 32, color: 'var(--cy)', opacity: .15 }}>◈</div>
          <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--mt)', letterSpacing: '.1em' }}>
            CONFIGURE O BANNER EM ADMIN → CONFIGURAÇÕES
          </span>
        </div>
      )}

      <div style={{ padding: '16px 20px' }}>

        {/* ── BARRA DE STATS ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          background: 'var(--s2)', border: '1px solid var(--bdr)',
          borderLeft: '3px solid var(--cy)',
          padding: '12px 20px', marginBottom: 20,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--cy)', letterSpacing: '.12em', marginBottom: 2 }}>// CLASSROOM</div>
            <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: 15, fontWeight: 900, letterSpacing: '.06em' }}>
              {primeiroNome.toUpperCase()}
            </div>
          </div>
          <div style={{ width: 1, height: 28, background: 'var(--bdr)', flexShrink: 0 }} />
          {[
            { v: perfil?.xpTotal ?? 0, l: 'XP' },
            { v: perfil?.level ?? 1, l: 'NÍVEL' },
            { v: concluidos, l: 'CONCLUÍDOS' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: 18 }}>{s.v}</div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--mt)', letterSpacing: '.08em' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── FRASE DO DIA ── */}
        {frase && (
          <div style={{ marginBottom: 20, padding: '12px 18px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em', marginBottom: '5px' }}>// FRASE DO DIA</div>
            <div style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.6, fontStyle: 'italic' }}>"{frase.texto}"</div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: '5px', letterSpacing: '.04em' }}>— {frase.autor}</div>
          </div>
        )}

        {/* ── CURSOS ── */}
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
    </div>
  )
}
