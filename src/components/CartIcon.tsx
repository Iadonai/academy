'use client'

import Link from 'next/link'
import { useCart } from '@/hooks/useCart'

export function CartIcon() {
  const { items, hydrated } = useCart()
  const count = items.length

  if (!hydrated) return null

  return (
    <Link
      href="/carrinho"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        color: count > 0 ? 'var(--cy)' : 'rgba(255,255,255,.35)',
        textDecoration: 'none',
        transition: 'color .15s',
      }}
      title="Carrinho"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && (
        <span style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: 'var(--cy)',
          color: '#06040e',
          fontSize: 9,
          fontWeight: 700,
          fontFamily: 'var(--font-m)',
          borderRadius: 99,
          minWidth: 14,
          height: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 3px',
          lineHeight: 1,
        }}>
          {count}
        </span>
      )}
    </Link>
  )
}
