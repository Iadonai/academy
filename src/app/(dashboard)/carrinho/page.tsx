'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from '@/hooks/useCart'

function formatarCpf(value: string) {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export default function CarrinhoPage() {
  const router = useRouter()
  const { items, removeItem, clear, total, hydrated } = useCart()
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length < 11) {
      setErro('CPF inválido — preencha os 11 dígitos')
      return
    }
    setLoading(true)
    setErro('')

    const res = await fetch('/api/checkout/carrinho', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfCnpj: cpfLimpo, courseIds: items.map(i => i.id) }),
    })
    const data = await res.json().catch(() => ({}))

    if (data.invoiceUrl) {
      clear()
      window.location.href = data.invoiceUrl
      return
    }
    if (data.redirect) {
      clear()
      router.push(data.redirect)
      return
    }

    const msg = data.detalhe?.errors?.[0]?.description ?? data.error ?? 'Erro ao gerar cobrança'
    setErro(msg)
    setLoading(false)
  }

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--mt)', letterSpacing: '.1em' }}>
          CARREGANDO...
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: .3 }}>🛒</div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--mt)', letterSpacing: '.1em', marginBottom: 8 }}>
          CARRINHO VAZIO
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.35)', marginBottom: 24 }}>
          Adicione cursos ao carrinho para comprá-los juntos.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 8, padding: '10px 24px',
            color: 'rgba(255,255,255,.6)', fontSize: 13, cursor: 'pointer',
          }}
        >
          ← Ver cursos
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 520, margin: '48px auto', padding: '0 20px' }}>
      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0 }}
      >
        ← Voltar
      </button>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--cy)', letterSpacing: '.14em', marginBottom: 16 }}>
        // CARRINHO
      </div>

      {/* Lista de itens */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.07)',
            borderRadius: 10, padding: '14px 16px',
          }}>
            {item.thumbnailUrl ? (
              <img src={item.thumbnailUrl} alt={item.title}
                style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 48, height: 48, borderRadius: 6, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(91,200,255,.15), rgba(167,139,250,.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: 'var(--cy)', opacity: .5,
              }}>◈</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.title}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#5bc8ff', marginTop: 2 }}>
                R$ {Number(item.price).toFixed(2).replace('.', ',')}
              </div>
            </div>
            <button
              onClick={() => removeItem(item.id)}
              style={{
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,.25)', fontSize: 18,
                cursor: 'pointer', padding: '4px 8px', lineHeight: 1,
                flexShrink: 0,
              }}
              title="Remover"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '14px 0', borderTop: '1px solid rgba(255,255,255,.07)',
        borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 28,
      }}>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em' }}>
          TOTAL ({items.length} {items.length === 1 ? 'curso' : 'cursos'})
        </span>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-h)' }}>
          R$ {total.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Formulário de checkout */}
      <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8, fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>
            CPF
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={e => setCpf(formatarCpf(e.target.value))}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,.05)',
              border: `1px solid ${erro ? 'rgba(239,68,68,.5)' : 'rgba(255,255,255,.1)'}`,
              borderRadius: 8, padding: '12px 14px',
              fontSize: 16, color: '#fff', outline: 'none',
              fontFamily: 'var(--font-m)', letterSpacing: '.08em',
            }}
          />
          {erro && <div style={{ fontSize: 12, color: '#f87171', marginTop: 6 }}>{erro}</div>}
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', margin: 0, lineHeight: 1.6 }}>
          Você será redirecionado para a página segura do Asaas onde poderá pagar via PIX, boleto ou cartão de crédito.
        </p>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg, #5bc8ff, #a78bfa)',
            border: 'none', borderRadius: 8, padding: '13px',
            color: loading ? 'rgba(255,255,255,.4)' : '#06040e',
            fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'GERANDO COBRANÇA...' : `PAGAR R$ ${total.toFixed(2).replace('.', ',')} →`}
        </button>
      </form>
    </div>
  )
}
