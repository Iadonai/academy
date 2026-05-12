'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface InfoCheckout {
  id: string
  title: string
  price: string
  thumbnailUrl: string | null
  email: string
  cpfCnpj: string
}

export default function CheckoutPage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const router = useRouter()

  const [info, setInfo] = useState<InfoCheckout | null>(null)
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    fetch(`/api/checkout/${cursoId}/info`)
      .then(r => r.json())
      .then((data: InfoCheckout) => {
        setInfo(data)
        if (data.cpfCnpj) setCpf(formatarCpf(data.cpfCnpj))
      })
  }, [cursoId])

  function formatarCpf(value: string) {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    return nums
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
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

    const res = await fetch(`/api/checkout/${cursoId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpfCnpj: cpfLimpo }),
    })

    const data = await res.json().catch(() => ({}))

    if (data.invoiceUrl) {
      window.location.href = data.invoiceUrl
      return
    }
    if (data.redirect) {
      router.push(data.redirect)
      return
    }

    const msg = data.detalhe?.errors?.[0]?.description ?? data.error ?? 'Erro ao gerar cobrança'
    setErro(msg)
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
    <div style={{ maxWidth: 480, margin: '48px auto', padding: '0 20px' }}>

      <button
        onClick={() => router.back()}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.35)', fontSize: 13, cursor: 'pointer', marginBottom: 28, padding: 0 }}
      >
        ← Voltar
      </button>

      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--cy)', letterSpacing: '.14em', marginBottom: 12 }}>
        // CHECKOUT
      </div>

      {/* Card do curso */}
      <div style={{
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 12, padding: 20,
        display: 'flex', gap: 16, alignItems: 'center',
        marginBottom: 28,
      }}>
        {info.thumbnailUrl ? (
          <img src={info.thumbnailUrl} alt={info.title}
            style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(91,200,255,.15), rgba(167,139,250,.1))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, color: 'var(--cy)', opacity: .4,
          }}>◈</div>
        )}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.4, marginBottom: 6 }}>
            {info.title}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-h)' }}>
            R$ {Number(info.price).toFixed(2).replace('.', ',')}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Email — somente leitura */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8, fontFamily: 'var(--font-m)', letterSpacing: '.06em' }}>
            EMAIL
          </label>
          <div style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,.03)',
            border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 8, padding: '12px 14px',
            fontSize: 14, color: 'rgba(255,255,255,.5)',
          }}>
            {info.email}
          </div>
        </div>

        {/* CPF */}
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
          {loading ? 'GERANDO COBRANÇA...' : 'IR PARA O PAGAMENTO →'}
        </button>
      </form>
    </div>
  )
}

