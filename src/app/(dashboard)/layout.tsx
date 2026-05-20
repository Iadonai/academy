import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'
import { EventTracker } from '@/components/EventTracker'
import { Ping } from '@/components/Ping'
import { TopNav } from '@/components/TopNav'

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
  const isInstrutor = perfil?.role === 'INSTRUCTOR' || perfil?.role === 'ADMIN'
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

  const links = [
    { href: '/comunidade', label: 'Comunidade', pip: true },
    { href: '/dashboard', label: 'Classroom' },
    { href: '/lives', label: 'Lives' },
    { href: '/noticias', label: 'Notícias' },
    { href: '/vagas', label: 'Vagas' },
    { href: '/trending', label: 'Trends' },
    { href: '/stack', label: 'Stack' },
    { href: '/ranking', label: 'Ranking' },
    ...(isInstrutor ? [{ href: '/instrutor', label: 'Instrutor' }] : []),
    ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : []),
  ]

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

      <TopNav
        links={links}
        primeiroNome={primeiroNome}
        iniciais={iniciais}
        xpTotal={perfil?.xpTotal ?? 0}
        level={perfil?.level ?? 1}
        concluidos={concluidos}
        logout={logout}
      />

      <Suspense fallback={null}>
        <EventTracker />
        <Ping />
      </Suspense>
      <main>{children}</main>
    </div>
  )
}
