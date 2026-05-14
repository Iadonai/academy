import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function InstrutorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, name: true },
  })

  if (perfil?.role !== 'INSTRUCTOR' && perfil?.role !== 'ADMIN') redirect('/dashboard')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#1c1c1e' }}>
      <aside style={{
        width: '220px', flexShrink: 0,
        background: '#111', borderRight: '1px solid rgba(255,255,255,.07)',
        display: 'flex', flexDirection: 'column', padding: '32px 0',
      }}>
        <div style={{ padding: '0 24px 32px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'var(--font-h, sans-serif)', fontSize: 13, color: '#5bc8ff', fontWeight: 700, letterSpacing: '.08em' }}>
              ← IADONAI
            </span>
          </Link>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', marginTop: 6 }}>Área do Instrutor</div>
        </div>

        <nav style={{ padding: '16px 0', flex: 1 }}>
          {[
            { href: '/instrutor/cursos', label: 'Cursos', icon: '▶' },
            { href: '/instrutor/desempenho', label: 'Desempenho', icon: '📈' },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href} className="instrutor-nav-link" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 24px', textDecoration: 'none',
              color: 'rgba(255,255,255,.55)', fontSize: 13,
            }}>
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <style>{`
        .instrutor-nav-link:hover { color: #fff !important; background: rgba(255,255,255,.04) !important; }
      `}</style>

      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}
