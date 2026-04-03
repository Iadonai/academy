import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      course: { select: { title: true } },
    },
  })

  if (!cert) notFound()

  const data = cert.issuedAt.toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Inter:wght@400;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #06040e; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: 'Inter', sans-serif; padding: 24px; }
        @media print {
          body { background: #06040e; padding: 0; }
          .no-print { display: none !important; }
          .cert { page-break-inside: avoid; }
        }
      `}</style>

      {/* Botões de ação */}
      <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => window.print()}
          style={{ padding: '8px 20px', background: 'rgba(91,200,255,.1)', border: '1px solid rgba(91,200,255,.4)', color: '#5bc8ff', fontFamily: 'monospace', fontSize: '12px', letterSpacing: '.08em', cursor: 'pointer' }}
        >
          IMPRIMIR / SALVAR PDF
        </button>
      </div>

      {/* Certificado */}
      <div className="cert" style={{
        width: '794px', minHeight: '562px',
        background: '#0a0812',
        border: '1px solid rgba(91,200,255,.15)',
        position: 'relative',
        padding: '60px 70px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0',
      }}>
        {/* Cantos decorativos */}
        {[
          { top: '16px', left: '16px', borderTop: '2px solid #5bc8ff', borderLeft: '2px solid #5bc8ff' },
          { top: '16px', right: '16px', borderTop: '2px solid #5bc8ff', borderRight: '2px solid #5bc8ff' },
          { bottom: '16px', left: '16px', borderBottom: '2px solid #5bc8ff', borderLeft: '2px solid #5bc8ff' },
          { bottom: '16px', right: '16px', borderBottom: '2px solid #5bc8ff', borderRight: '2px solid #5bc8ff' },
        ].map((style, i) => (
          <div key={i} style={{ position: 'absolute', width: '28px', height: '28px', ...style }} />
        ))}

        {/* Grade de fundo */}
        <div style={{
          position: 'absolute', inset: 0, opacity: .03,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 29px,#5bc8ff 29px,#5bc8ff 30px),repeating-linear-gradient(90deg,transparent,transparent 29px,#5bc8ff 29px,#5bc8ff 30px)',
        }} />

        {/* Logo */}
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '22px', fontWeight: 900, color: '#5bc8ff', letterSpacing: '.2em', marginBottom: '6px', position: 'relative' }}>
          IADONAI ACADEMY
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(91,200,255,.5)', letterSpacing: '.25em', marginBottom: '40px', position: 'relative' }}>
          // CERTIFICADO DE CONCLUSÃO
        </div>

        {/* Linha divisória */}
        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(91,200,255,.4), transparent)', marginBottom: '40px', position: 'relative' }} />

        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(91,200,255,.6)', letterSpacing: '.15em', marginBottom: '16px', position: 'relative' }}>
          CERTIFICAMOS QUE
        </div>

        {/* Nome do aluno */}
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '32px', fontWeight: 900,
          color: '#ffffff',
          letterSpacing: '.06em',
          textAlign: 'center',
          lineHeight: 1.2,
          marginBottom: '24px',
          position: 'relative',
          textShadow: '0 0 30px rgba(91,200,255,.3)',
        }}>
          {cert.user.name.toUpperCase()}
        </div>

        <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'rgba(91,200,255,.6)', letterSpacing: '.15em', marginBottom: '16px', position: 'relative' }}>
          CONCLUIU COM ÊXITO O CURSO
        </div>

        {/* Nome do curso */}
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 700,
          color: '#5bc8ff',
          letterSpacing: '.08em',
          textAlign: 'center',
          lineHeight: 1.35,
          marginBottom: '40px',
          position: 'relative',
        }}>
          {cert.course.title.toUpperCase()}
        </div>

        {/* Linha divisória */}
        <div style={{ width: '100%', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(91,200,255,.4), transparent)', marginBottom: '28px', position: 'relative' }} />

        {/* Rodapé */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
          <div>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(91,200,255,.5)', letterSpacing: '.1em', marginBottom: '4px' }}>// DATA DE EMISSÃO</div>
            <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#fff' }}>{data}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(91,200,255,.4)', letterSpacing: '.08em', marginBottom: '4px' }}>VERIFICAR AUTENTICIDADE</div>
            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(91,200,255,.5)', wordBreak: 'break-all', maxWidth: '180px' }}>
              iadonai.com.br/certificado/{id}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(91,200,255,.3)', marginTop: '4px' }}>ID: {id.slice(0, 8).toUpperCase()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(91,200,255,.5)', letterSpacing: '.1em', marginBottom: '4px' }}>// ASSINATURA</div>
            <div style={{ width: '120px', borderBottom: '1px solid rgba(91,200,255,.3)', marginBottom: '4px' }} />
            <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '10px', color: '#5bc8ff' }}>IADONAI</div>
          </div>
        </div>
      </div>

      {/* Info verificação */}
      <div className="no-print" style={{ marginTop: '20px', fontFamily: 'monospace', fontSize: '11px', color: 'rgba(91,200,255,.4)', textAlign: 'center', letterSpacing: '.06em' }}>
        CERTIFICADO VERIFICÁVEL — ID {id.toUpperCase()}
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('button').forEach(b => {
          b.addEventListener('click', () => window.print())
        })
      ` }} />
    </>
  )
}
