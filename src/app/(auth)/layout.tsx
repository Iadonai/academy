import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>

      {/* Lado esquerdo — imagem */}
      <div style={{
        flex: 1,
        display: 'none',
        background: '#06040e',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }} className="auth-left">
        <Image
          src="/bg-login.jpg"
          alt=""
          width={1920}
          height={1080}
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center' }}
          priority
        />
        {/* Gradiente para fundir com o lado direito */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(6,4,14,0) 60%, rgba(6,4,14,1) 100%)',
        }} />
      </div>

      {/* Lado direito — formulário */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#06040e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Névoa roxa de fundo */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-20%',
          width: '500px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(110,50,190,.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* IADONAI ACADEMY */}
        <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
          <div style={{
            fontFamily: 'var(--font-h, sans-serif)',
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '.14em',
            background: 'linear-gradient(180deg, #ffffff 0%, #c0c8d8 40%, #8898aa 70%, #c8d4e0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            IADONAI ACADEMY
          </div>
          <div style={{
            height: '2px', marginTop: '8px',
            background: 'linear-gradient(to right, transparent, rgba(91,200,255,.5), transparent)',
          }} />
        </div>

        {/* Card */}
        <div style={{
          width: '100%',
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: '12px',
          padding: '28px',
          backdropFilter: 'blur(10px)',
          position: 'relative',
        }}>
          {children}
        </div>

        <div style={{
          marginTop: '20px',
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
