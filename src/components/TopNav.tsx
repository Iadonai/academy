'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavItem = {
  href: string
  label: string
  pip?: boolean
}

type Props = {
  links: NavItem[]
  primeiroNome: string
  iniciais: string
  xpTotal: number
  level: number
  concluidos: number
  logout: () => Promise<void>
}

export function TopNav({ links, primeiroNome, iniciais, xpTotal, level, concluidos, logout }: Props) {
  const [open, setOpen] = useState(false)

  const stats = [
    { v: xpTotal, l: 'XP' },
    { v: level, l: 'NV' },
    { v: concluidos, l: '✓' },
  ]

  return (
    <>
      <nav className="topnav">
        <Link href="/dashboard" className="brand">
          IAD<span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '18px', height: '18px', border: '2px solid var(--cy)',
            borderRadius: '50%', fontSize: '9px', color: 'var(--cy)',
            marginInline: '1px', verticalAlign: 'middle', boxShadow: '0 0 8px var(--cy)',
            fontFamily: 'var(--font-h)',
          }}>◎</span>NAI
        </Link>

        <div className="topnav-links">
          {links.map(link => (
            <Link key={link.href} href={link.href} className="nav-tab">
              {link.label}
              {link.pip && <span className="tab-pip" />}
            </Link>
          ))}
        </div>

        <div className="topnav-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'var(--font-h)', fontSize: 11, color: 'var(--cy)', letterSpacing: '.08em', fontWeight: 700 }}>
              {primeiroNome.toUpperCase()}
            </span>
            <span style={{ width: 1, height: 14, background: 'var(--bdr)', display: 'inline-block' }} />
            {stats.map(s => (
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

        <button className="nav-hamburger" onClick={() => setOpen(true)} aria-label="Abrir menu">
          <span /><span /><span />
        </button>
      </nav>

      {open && (
        <div className="nav-mobile-bg" onClick={() => setOpen(false)}>
          <div className="nav-mobile-drawer" onClick={e => e.stopPropagation()}>
            <div className="nav-mobile-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-h)', fontSize: 12, color: 'var(--cy)', letterSpacing: '.08em' }}>
                  {primeiroNome.toUpperCase()}
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {stats.map(s => (
                    <span key={s.l} style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                      <span className="xp-chip" style={{ fontSize: 10, padding: '2px 7px' }}>{s.v}</span>
                      <span style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: 'var(--mt)' }}>{s.l}</span>
                    </span>
                  ))}
                </div>
              </div>
              <button className="nav-mobile-close" onClick={() => setOpen(false)}>✕ FECHAR</button>
            </div>

            <nav className="nav-mobile-links">
              {links.map(link => (
                <Link key={link.href} href={link.href} className="nav-mobile-link" onClick={() => setOpen(false)}>
                  {link.label}
                  {link.pip && <span className="tab-pip" style={{ marginLeft: 6 }} />}
                </Link>
              ))}
            </nav>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--bdr)', display: 'flex', gap: 10, alignItems: 'center' }}>
              <Link href="/perfil" className="hex-av" style={{ textDecoration: 'none' }} onClick={() => setOpen(false)}>
                {iniciais}
              </Link>
              <form action={logout} style={{ margin: 0, flex: 1 }}>
                <button type="submit" className="btn-ghost" style={{ width: '100%', padding: '8px', fontSize: '11px' }}>
                  SAIR
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
