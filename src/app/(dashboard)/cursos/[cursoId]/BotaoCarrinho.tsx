'use client'

import Link from 'next/link'
import { useCart, type CartItem } from '@/hooks/useCart'

interface Props {
  curso: CartItem
}

export function BotaoCarrinho({ curso }: Props) {
  const { addItem, hasItem, hydrated } = useCart()
  const noCarrinho = hydrated && hasItem(curso.id)

  function handleAdd() {
    addItem(curso)
  }

  if (!hydrated) return null

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
      <Link
        href={`/checkout/${curso.id}`}
        style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #5bc8ff, #a78bfa)',
          borderRadius: '8px', padding: '11px 24px',
          color: '#06040e', fontWeight: 700, fontSize: '13px',
          textDecoration: 'none', whiteSpace: 'nowrap',
        }}
      >
        Comprar só este →
      </Link>

      {noCarrinho ? (
        <Link
          href="/carrinho"
          style={{
            display: 'inline-block',
            background: 'rgba(91,200,255,.1)',
            border: '1px solid rgba(91,200,255,.4)',
            borderRadius: '8px', padding: '11px 24px',
            color: '#5bc8ff', fontWeight: 700, fontSize: '13px',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          ✓ No carrinho — ver carrinho
        </Link>
      ) : (
        <button
          onClick={handleAdd}
          style={{
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: '8px', padding: '11px 24px',
            color: 'rgba(255,255,255,.7)', fontWeight: 600, fontSize: '13px',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          + Adicionar ao carrinho
        </button>
      )}
    </div>
  )
}
