'use client'

import { useActionState } from 'react'
import { verificarOtp } from '@/app/actions/auth'

export function ConfirmarForm({
  tokenHash,
  type,
}: {
  tokenHash?: string
  type?: string
}) {
  const [state, action, pending] = useActionState(verificarOtp, null)

  if (!tokenHash) {
    return (
      <p style={{ color: '#fca5a5', fontSize: '13px' }}>
        Link inválido. Solicite um novo link de recuperação de senha.
      </p>
    )
  }

  return (
    <>
      {state?.erro && (
        <div style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>
          {state.erro}
        </div>
      )}
      <form action={action}>
        <input type="hidden" name="token_hash" value={tokenHash} />
        <input type="hidden" name="type" value={type ?? 'recovery'} />
        <button
          type="submit"
          disabled={pending}
          style={{ width: '100%', background: pending ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg,#5bc8ff,#a78bfa)', border: 'none', borderRadius: '6px', padding: '11px', color: pending ? 'rgba(255,255,255,.4)' : '#06040e', fontWeight: 700, fontSize: '14px', cursor: pending ? 'not-allowed' : 'pointer' }}
        >
          {pending ? 'Verificando...' : 'Confirmar e criar nova senha'}
        </button>
      </form>
    </>
  )
}
