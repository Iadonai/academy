import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#080c10',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid de fundo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(91,200,255,.04) 39px,rgba(91,200,255,.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(91,200,255,.04) 39px,rgba(91,200,255,.04) 40px)',
      }} />

      {/* Logo */}
      <div style={{ padding: '32px 16px 8px', textAlign: 'center' }}>
        <Image
          src="/logo-iadonai.png"
          alt="Comunidade Iadonai"
          width={1024}
          height={302}
          style={{ maxWidth: '100%', height: 'auto' }}
          priority
        />
      </div>

      {/* Brilho */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '300px',
        background: 'radial-gradient(ellipse at center, rgba(91,200,255,.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Card do formulário */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 16px 40px', position: 'relative' }}>
        <div style={{
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '12px',
          padding: '28px',
        }}>
          {children}
        </div>

        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: 'rgba(91,200,255,.3)',
          letterSpacing: '.1em',
        }}>
          // ACADEMY_v1.0
        </div>
      </div>
    </div>
  )
}
