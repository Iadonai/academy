import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'
import { EventTracker } from '@/components/EventTracker'
import { Ping } from '@/components/Ping'

const TICKER_ITEMS = [
  'IADONAI ACADEMY // SISTEMA ONLINE',
  'PROVÉRBIOS 8:12 // SABEDORIA | CONHECIMENTO | INOVAÇÃO',
  'NOVOS CURSOS DISPONÍVEIS // ACESSE AGORA',
  'COMUNIDADE ATIVA // COMPARTILHE CONHECIMENTO',
  'GAMIFICAÇÃO // ACUMULE XP E SUBA DE NÍVEL',
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, xpTotal: true, level: true, role: true },
  })

  const isAdmin = perfil?.role === 'ADMIN'
  const primeiroNome = perfil?.name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'ALUNO'
  const iniciais = perfil?.name
    ? perfil.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : user.email?.[0].toUpperCase() ?? '?'

  const [progresses, todosCursos] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true } }),
    prisma.course.findMany({
      where: { published: true },
      select: { id: true, modules: { select: { lessons: { select: { id: true } } } } },
    }),
  ])
  const concluidosSet = new Set(progresses.map(p => p.lessonId))
  const concluidos = todosCursos.filter(c => {
    const aulas = c.modules.flatMap(m => m.lessons)
    return aulas.length > 0 && aulas.every(a => concluidosSet.has(a.id))
  }).length

  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="scanline" />

      {/* Ticker */}
      <div className="ticker-bar">
        <div className="ticker-inner">
          {tickerContent.map((item, i) => (
            <span key={i} className="ticker-item">
              {item.split('//').map((part, j) => (
                <span key={j}>
                  {j > 0 && <span className="ticker-sep">//</span>}
                  {part.trim()}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* Top nav */}
      <nav className="topnav">
        <Link href="/dashboard" className="brand">
          IAD<span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            border: '2px solid var(--cy)',
            borderRadius: '50%',
            fontSize: '9px',
            color: 'var(--cy)',
            marginInline: '1px',
            verticalAlign: 'middle',
            boxShadow: '0 0 8px var(--cy)',
            fontFamily: 'var(--font-h)',
          }}>◎</span>NAI
        </Link>

        <div style={{ display: 'flex', flex: 1 }}>
          <NavLink href="/comunidade">
            Comunidade <span className="tab-pip" />
          </NavLink>
          <NavLink href="/dashboard">Classroom</NavLink>
          <NavLink href="/lives">Lives</NavLink>
          <NavLink href="/noticias">Notícias</NavLink>
          <NavLink href="/vagas">Vagas</NavLink>
          <NavLink href="/trending">Trends</NavLink>
          <NavLink href="/stack">Stack</NavLink>
          <NavLink href="/ranking">Ranking</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
          {/* Stats do usuário */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: 11, color: 'var(--cy)', letterSpacing: '.08em', fontWeight: 700 }}>
              {primeiroNome.toUpperCase()}
            </span>
            <span style={{ width: 1, height: 14, background: 'var(--bdr)', display: 'inline-block' }} />
            {[
              { v: perfil?.xpTotal ?? 0, l: 'XP' },
              { v: perfil?.level ?? 1, l: 'NV' },
              { v: concluidos, l: '✓' },
            ].map(s => (
              <span key={s.l} style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span className="xp-chip" style={{ letterSpacing: '.04em' }}>{s.v}</span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--mt)', letterSpacing: '.06em' }}>{s.l}</span>
              </span>
            ))}
          </div>

          <form action={logout} style={{ margin: 0 }}>
            <button type="submit" className="btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }}>
              SAIR
            </button>
          </form>
          <Link href="/perfil" className="hex-av" style={{ textDecoration: 'none' }}>{iniciais}</Link>
        </div>
      </nav>

      <Suspense fallback={null}>
        <EventTracker />
        <Ping />
      </Suspense>
      <main>{children}</main>
    </div>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="nav-tab">
      {children}
    </Link>
  )
}
