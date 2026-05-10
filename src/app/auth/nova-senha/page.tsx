'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { novaSenha } from '@/app/actions/auth'

export default function NovaSenhaPage() {
  const [state, action, pending] = useActionState(novaSenha, null)

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#06040e', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{
        position: 'fixed', top: '-10%', left: '-20%',
        width: '500px', height: '500px',
        background: 'radial-gradient(ellipse, rgba(110,50,190,.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            fontFamily: 'var(--font-h, sans-serif)', fontSize: '24px', fontWeight: 900,
            letterSpacing: '.14em',
            background: 'linear-gradient(180deg, #ffffff 0%, #c0c8d8 40%, #8898aa 70%, #c8d4e0 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            IADONAI ACADEMY
          </div>
          <div style={{ height: '2px', marginTop: '8px', background: 'linear-gradient(to right, transparent, rgba(91,200,255,.5), transparent)' }} />
        </div>

        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '12px', padding: '28px', backdropFilter: 'blur(10px)',
        }}>
          <h2 style={{ color: '#fff', fontWeight: 600, fontSize: '18px', marginBottom: '4px' }}>Nova senha</h2>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: '13px', marginBottom: '20px' }}>
            Escolha uma nova senha para sua conta.
          </p>

          {state?.erro && (
            <div style={{
              background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)',
              borderRadius: '6px', padding: '10px 14px', fontSize: '13px',
              color: '#fca5a5', marginBottom: '16px',
            }}>
              {state.erro}
            </div>
          )}

          {state?.sucesso ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
              <p style={{ color: 'rgba(255,255,255,.7)', fontSize: '14px', marginBottom: '20px' }}>
                Senha atualizada com sucesso!
              </p>
              <Link href="/login" style={{
                display: 'inline-block', background: 'rgba(91,200,255,.15)',
                border: '1px solid rgba(91,200,255,.3)', borderRadius: '6px',
                padding: '10px 20px', color: 'rgba(91,200,255,.9)',
                fontSize: '13px', textDecoration: 'none',
              }}>
                Ir para o login
              </Link>
            </div>
          ) : (
            <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Nova senha
                </label>
                <input
                  name="password" type="password"
                  placeholder="Mínimo 6 caracteres" minLength={6} required
                  style={{
                    width: '100%', background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px',
                    padding: '10px 12px', color: '#fff', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ color: 'rgba(255,255,255,.7)', fontSize: '12px', display: 'block', marginBottom: '4px' }}>
                  Confirmar nova senha
                </label>
                <input
                  name="confirmPassword" type="password"
                  placeholder="Repita a senha" minLength={6} required
                  style={{
                    width: '100%', background: 'rgba(255,255,255,.06)',
                    border: '1px solid rgba(255,255,255,.1)', borderRadius: '6px',
                    padding: '10px 12px', color: '#fff', fontSize: '14px',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="submit" disabled={pending}
                style={{
                  width: '100%',
                  background: pending ? 'rgba(255,255,255,.1)' : 'linear-gradient(135deg, #5bc8ff, #a78bfa)',
                  border: 'none', borderRadius: '6px', padding: '11px',
                  color: pending ? 'rgba(255,255,255,.4)' : '#06040e',
                  fontWeight: 700, fontSize: '14px',
                  cursor: pending ? 'not-allowed' : 'pointer',
                }}
              >
                {pending ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'monospace', fontSize: '10px', color: 'rgba(150,100,255,.3)', letterSpacing: '.1em' }}>
          // ACADEMY_v1.0
        </div>
      </div>
    </div>
  )
}
