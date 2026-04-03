import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080c10',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid de fundo */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(91,200,255,.04) 39px,rgba(91,200,255,.04) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(91,200,255,.04) 39px,rgba(91,200,255,.04) 40px)',
      }} />

      {/* Brilho central */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '700px', height: '300px',
        background: 'radial-gradient(ellipse at center, rgba(91,200,255,.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Image
            src="/logo-iadonai.png"
            alt="Comunidade Iadonai"
            width={360}
            height={120}
            style={{ objectFit: 'contain', margin: '0 auto' }}
            priority
          />
        </div>

        {/* Card do formulário */}
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
