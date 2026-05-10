'use client'

import { useActionState } from 'react'
import { verificarOtp } from '@/app/actions/auth'

export default function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const [state, action, pending] = useActionState(verificarOtp, null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#06040e', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'fixed', top: '-10%', left: '-20%', width: '500px', height: '500px', background: 'radial-gradient(ellipse, rgba(110,50,190,.25) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontFamily: 'var(--font-h, sans-serif)', fontSize: '24px', fontWeight: 900, letterSpacing: '.14em', background: 'linear-gradient(180deg,#fff 0%,#c0c8d8 40%,#8898aa 70%,#c8d4e0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            IADONAI ACADEMY
          </div>
          <div style={{ height: '2px', marginTop: '8px', background: 'linear-gradient(to right,transparent,rgba(91,200,255,.5),transparent)' }} />
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '12px', padding: '28px', backdropFilter: 'blur(10px)' }}>
          <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Redefinir senha</h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', marginBottom: '20px' }}>
            Clique no botão abaixo para continuar e criar sua nova senha.
          </p>

          {state?.erro && (
            <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>
              {state.erro}
            </div>
          )}

          <TokenForm action={action} pending={pending} searchParams={searchParams} />
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'monospace', fontSize: '10px', color: 'rgba(150,100,255,.3)', letterSpacing: '.1em' }}>
          // ACADEMY_v1.0
        </div>
      </div>
    </div>
  )
}

async function TokenForm({
  action,
  pending,
  searchParams,
}: {
  action: (payload: FormData) => void
  pending: boolean
  searchParams: Promise<{ token_hash?: string; type?: string }>
}) {
  const { token_hash, type } = await searchParams

  if (!token_hash) {
    return (
      <p style={{ color: '#fca5a5', fontSize: '13px' }}>
        Link inválido. Solicite um novo link de recuperação de senha.
      </p>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="token_hash" value={token_hash} />
      <input type="hidden" name="type" value={type ?? 'recovery'} />
      <button
        type="submit"
        disabled={pending}
        style={{ width: '100%', background: pending ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#5bc8ff,#a78bfa)', border: 'none', borderRadius: '6px', padding: '11px', color: pending ? 'rgba(255,255,255,.4)' : '#06040e', fontWeight: 700, fontSize: '14px', cursor: pending ? 'not-allowed' : 'pointer' }}
      >
        {pending ? 'Verificando...' : 'Confirmar e criar nova senha'}
      </button>
    </form>
  )
}
