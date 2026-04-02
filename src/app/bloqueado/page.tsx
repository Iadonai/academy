import { logout } from '@/app/actions/auth'

export default function BloqueadoPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#06040F', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: '48px', marginBottom: '16px' }}>🚫</div>
        <div style={{ fontFamily: 'var(--font-h)', fontSize: '18px', color: '#FF4444', letterSpacing: '.1em', marginBottom: '10px' }}>
          ACESSO BLOQUEADO
        </div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: '13px', color: '#8888A8', lineHeight: 1.7, marginBottom: '24px' }}>
          Sua conta foi suspensa. Entre em contato com o administrador para mais informações.
        </div>
        <form action={logout}>
          <button type="submit" style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: '#8888A8', background: 'none', border: '1px solid #2A1A50', padding: '8px 20px', cursor: 'pointer', letterSpacing: '.06em' }}>
            SAIR
          </button>
        </form>
      </div>
    </div>
  )
}
