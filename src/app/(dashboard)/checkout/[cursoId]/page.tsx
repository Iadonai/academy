'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'

interface BumpCurso {
  id: string
  title: string
  price: string
  thumbnailUrl: string | null
}

interface InfoCheckout {
  id: string
  title: string
  price: string
  thumbnailUrl: string | null
  email: string
  cpfCnpj: string
  bumps: BumpCurso[]
}

function formatarCpf(value: string) {
  const nums = value.replace(/\D/g, '').slice(0, 11)
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function Thumb({ url, title, size = 56 }: { url: string | null; title: string; size?: number }) {
  if (url) return (
    <img src={url} alt={title}
      style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, rgba(91,200,255,.15), rgba(167,139,250,.1))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, color: 'var(--cy)', opacity: .5,
    }}>◈</div>
  )
}

export default function CheckoutPage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const router = useRouter()

  const [info, setInfo] = useState<InfoCheckout | null>(null)
  const [extras, setExtras] = useState<Set<string>>(new Set())
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/checkout/${cursoId}/info`)
      .then(r => r.json())
      .then((data: InfoCheckout) => {
        if (!data.id) {
          setErro('Erro ao carregar curso.')
          setInfo({ id: cursoId, title: '', price: '0', thumbnailUrl: null, email: '', cpfCnpj: '', bumps: [] })
          return
        }
        setInfo(data)
        if (data.cpfCnpj) setCpf(formatarCpf(data.cpfCnpj))
      })
      .catch(() => {
        setErro('Erro ao carregar. Tente novamente.')
        setInfo({ id: cursoId, title: '...', price: '0', thumbnailUrl: null, email: '', cpfCnpj: '', bumps: [] })
      })
  }, [cursoId])

  const toggleExtra = useCallback((id: string) => {
    setExtras(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const totalSelecionados = info
    ? [info, ...(info.bumps.filter(b => extras.has(b.id)))]
    : []
  const total = totalSelecionados.reduce((acc, c) => acc + Number(c.price), 0)
  const qtd = totalSelecionados.length

  function lerCookie(nome: string): string {
    return document.cookie.split('; ').find(r => r.startsWith(nome + '='))?.split('=')[1] ?? ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length < 11) {
      setErro('CPF inválido — preencha os 11 dígitos')
      return
    }
    setLoading(true)
    setErro('')

    const fbp = lerCookie('_fbp')
    const fbc = lerCookie('_fbc')

    let res: Response
    if (extras.size === 0) {
      res = await fetch(`/api/checkout/${cursoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: cpfLimpo, fbp, fbc }),
      })
    } else {
      res = await fetch('/api/checkout/carrinho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpfCnpj: cpfLimpo, courseIds: [cursoId, ...Array.from(extras)], fbp, fbc }),
      })
    }

    const data = await res.json().catch(() => ({}))

    if (data.invoiceUrl) {
      window.location.href = data.invoiceUrl
      return
    }
    if (data.redirect) {
      router.push(data.redirect)
      return
    }

    setErro(data.detalhe?.errors?.[0]?.description ?? data.error ?? 'Erro ao gerar cobrança')
    setLoading(false)
  }

  if (!info) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--mt)', letterSpacing: '.1em' }}>
          CARREGANDO...
        </div>
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
        // CHECKOUT
      </div>

      {/* Curso principal — sempre selecionado */}
      <div style={{
        background: 'rgba(91,200,255,.06)',
        border: '1px solid rgba(91,200,255,.25)',
        borderRadius: 12, padding: '16px 18px',
        display: 'flex', gap: 14, alignItems: 'center',
        marginBottom: info.bumps.length > 0 ? 4 : 24,
      }}>
        <Thumb url={info.thumbnailUrl} title={info.title} size={52} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-m)', color: '#5bc8ff', letterSpacing: '.1em', marginBottom: 4 }}>
            ✓ SEU PEDIDO
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
            {info.title}
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-h)', flexShrink: 0 }}>
          R$ {Number(info.price).toFixed(2).replace('.', ',')}
        </div>
      </div>

      {/* Order bumps */}
      {info.bumps.length > 0 && (
        <>
          <div style={{
            fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.35)',
            letterSpacing: '.1em', padding: '14px 0 10px',
          }}>
            ADICIONE AO SEU PEDIDO
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {info.bumps.map(bump => {
              const selecionado = extras.has(bump.id)
              return (
                <button
                  key={bump.id}
                  type="button"
                  onClick={() => toggleExtra(bump.id)}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'center',
                    background: selecionado ? 'rgba(167,139,250,.1)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${selecionado ? 'rgba(167,139,250,.4)' : 'rgba(255,255,255,.08)'}`,
                    borderRadius: 12, padding: '14px 16px',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                    transition: 'all .15s',
                  }}
                >
                  <Thumb url={bump.thumbnailUrl} title={bump.title} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: selecionado ? '#fff' : 'rgba(255,255,255,.7)', lineHeight: 1.3 }}>
                      {bump.title}
                    </div>
                    <div style={{ fontSize: 11, color: selecionado ? '#a78bfa' : 'rgba(255,255,255,.3)', marginTop: 3 }}>
                      {selecionado ? '✓ adicionado ao pedido' : '+ adicionar ao pedido'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 15, fontWeight: 800, color: selecionado ? '#a78bfa' : 'rgba(255,255,255,.5)',
                    fontFamily: 'var(--font-h)', flexShrink: 0,
                  }}>
                    R$ {Number(bump.price).toFixed(2).replace('.', ',')}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Resumo do total */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.07)',
        borderBottom: '1px solid rgba(255,255,255,.07)', marginBottom: 24,
      }}>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em' }}>
          TOTAL — {qtd} {qtd === 1 ? 'curso' : 'cursos'}
        </span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-h)', transition: 'all .2s' }}>
          R$ {total.toFixed(2).replace('.', ',')}
        </span>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 7, fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>
            EMAIL
          </label>
          <div style={{
            background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 8, padding: '11px 14px', fontSize: 13, color: 'rgba(255,255,255,.45)',
          }}>
            {info.email}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 7, fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>
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
          {erro && <div style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>{erro}</div>}
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.25)', margin: 0, lineHeight: 1.6 }}>
          Você será redirecionado para a página segura do Asaas onde poderá pagar via PIX, boleto ou cartão.
        </p>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg, #5bc8ff, #a78bfa)',
            border: 'none', borderRadius: 8, padding: '14px',
            color: loading ? 'rgba(255,255,255,.4)' : '#06040e',
            fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'GERANDO COBRANÇA...' : `PAGAR R$ ${total.toFixed(2).replace('.', ',')} →`}
        </button>
      </form>
    </div>
  )
}
