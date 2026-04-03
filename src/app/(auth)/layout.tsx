import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Imagem de fundo */}
      <Image
        src="/bg-login.jpg"
        alt=""
        fill
        style={{ objectFit: 'cover', objectPosition: 'center' }}
        priority
      />
      {/* Escurecimento sobre o fundo */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,4,14,.55)' }} />

      {/* Logo */}
      <div style={{ padding: '32px 16px 8px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Image
          src="/logo-iadonai.png"
          alt="Comunidade Iadonai"
          width={1024}
          height={302}
          style={{ maxWidth: '100%', height: 'auto', opacity: 0.9 }}
          priority
        />
      </div>

      {/* Card do formulário */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 16px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{
            fontFamily: 'var(--font-h, sans-serif)',
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '.14em',
            background: 'linear-gradient(180deg, #ffffff 0%, #c0c8d8 40%, #8898aa 70%, #c8d4e0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            IADONAI ACADEMY
          </div>
        </div>

        <div style={{
          background: 'rgba(6,4,14,.7)',
          border: '1px solid rgba(255,255,255,.1)',
          borderRadius: '12px',
          padding: '28px',
          backdropFilter: 'blur(12px)',
        }}>
          {children}
        </div>

        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: 'rgba(150,100,255,.4)',
          letterSpacing: '.1em',
        }}>
          // ACADEMY_v1.0
        </div>
      </div>
    </div>
  )
}
