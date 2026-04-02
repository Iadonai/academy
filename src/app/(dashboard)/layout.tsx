import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { logout } from '@/app/actions/auth'

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
    select: { name: true, xpTotal: true, role: true },
  })

  const isAdmin = perfil?.role === 'ADMIN'
  const iniciais = perfil?.name
    ? perfil.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : user.email?.[0].toUpperCase() ?? '?'

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
          <NavLink href="/ranking">Ranking</NavLink>
          {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
          <span className="xp-chip">{perfil?.xpTotal ?? 0} XP</span>
          <form action={logout} style={{ margin: 0 }}>
            <button type="submit" className="btn-ghost" style={{ padding: '4px 10px', fontSize: '11px' }}>
              SAIR
            </button>
          </form>
          <Link href="/perfil" className="hex-av" style={{ textDecoration: 'none' }}>{iniciais}</Link>
        </div>
      </nav>

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
