import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: '#06040e',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Névoa roxa — esquerda como na imagem */}
      <div style={{
        position: 'absolute', top: '0%', left: '15%',
        width: '700px', height: '600px',
        background: 'radial-gradient(ellipse at center, rgba(110,50,190,.4) 0%, rgba(70,20,140,.18) 45%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Névoa azul — direita */}
      <div style={{
        position: 'absolute', top: '5%', right: '5%',
        width: '450px', height: '400px',
        background: 'radial-gradient(ellipse at center, rgba(25,50,160,.22) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Estrelas */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: [
          'radial-gradient(1px 1px at 10% 12%, rgba(255,255,255,.7) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 25% 6%, rgba(255,255,255,.5) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 55% 10%, rgba(255,255,255,.4) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 78% 4%, rgba(255,255,255,.6) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 92% 18%, rgba(255,255,255,.3) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 3% 45%, rgba(255,255,255,.4) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 48% 38%, rgba(255,255,255,.3) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 68% 30%, rgba(255,255,255,.5) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 85% 55%, rgba(255,255,255,.3) 0%, transparent 100%)',
          'radial-gradient(1px 1px at 33% 70%, rgba(255,255,255,.4) 0%, transparent 100%)',
        ].join(','),
      }} />

      {/* Logo */}
      <div style={{ padding: '32px 16px 8px', textAlign: 'center', position: 'relative' }}>
        <Image
          src="/logo-iadonai.png"
          alt="Comunidade Iadonai"
          width={1024}
          height={302}
          style={{ maxWidth: '100%', height: 'auto' }}
          priority
        />
      </div>

      {/* Card do formulário */}
      <div style={{ width: '100%', maxWidth: '420px', padding: '0 16px 40px', position: 'relative' }}>
        <div style={{
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '12px',
          padding: '28px',
          backdropFilter: 'blur(8px)',
        }}>
          {children}
        </div>

        <div style={{
          textAlign: 'center', marginTop: '20px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: 'rgba(150,100,255,.3)',
          letterSpacing: '.1em',
        }}>
          // ACADEMY_v1.0
        </div>
      </div>
    </div>
  )
}
