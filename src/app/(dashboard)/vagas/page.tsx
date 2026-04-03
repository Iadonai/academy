import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Vaga {
  id: string
  title: string
  company: string
  location: string
  url: string
  date_posted: string
  description: string
  employment_type: string | null
  salary: string | null
  company_logo: string | null
}

const KEYWORDS = ['automation', 'n8n', 'data', 'python', 'inteligência artificial', 'machine learning', 'analytics', 'rpa', 'low-code', 'no-code', 'power bi', 'ai', 'artificial intelligence', 'automação']

async function buscarVagas(): Promise<{ vagas: Vaga[]; erro: string | null }> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return { vagas: [], erro: 'API key não configurada' }

  try {
    const res = await fetch(
      'https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?limit=100&offset=0&description_type=text',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'linkedin-job-search-api.p.rapidapi.com',
          'x-rapidapi-key': key,
        },
        cache: 'no-store',
      }
    )

    const data = await res.json()
    if (!res.ok) return { vagas: [], erro: JSON.stringify(data).slice(0, 200) }

    const todas: Vaga[] = Array.isArray(data) ? data : (data.jobs ?? data.data ?? [])

    const filtradas = todas.filter((v) => {
      const texto = `${v.title ?? ''} ${v.description ?? ''}`.toLowerCase()
      return KEYWORDS.some((k) => texto.includes(k.toLowerCase()))
    }).slice(0, 30)

    return { vagas: filtradas, erro: null }
  } catch (e) {
    return { vagas: [], erro: String(e) }
  }
}

const TIPO_COR: Record<string, string> = {
  'full-time': 'rgba(34,197,94,.3)',
  'part-time': 'rgba(234,179,8,.3)',
  'contract': 'rgba(91,200,255,.3)',
  'remote': 'rgba(155,111,255,.3)',
}

export default async function VagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { vagas, erro } = await buscarVagas()

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// MERCADO</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>VAGAS DE TECNOLOGIA</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Automação · Dados · IA · N8N · Python · Power BI</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{vagas.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// VAGAS</div>
        </div>
      </div>

      {erro && (
        <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'var(--font-m)', fontSize: '12px', color: '#f87171' }}>
          ⚠ {erro}
        </div>
      )}

      {vagas.length === 0 && !erro ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>SEM VAGAS NO MOMENTO.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {vagas.map((vaga) => (
            <div key={vaga.id} style={{
              background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: '3px solid var(--cy)',
              display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px',
            }}>
              {/* Empresa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: 'var(--s3)', border: '1px solid var(--bdr)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {vaga.company_logo
                    ? <img src={vaga.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontFamily: 'var(--font-h)', fontSize: '14px', color: 'var(--cy)', opacity: .5 }}>{vaga.company?.[0]?.toUpperCase() ?? '?'}</span>
                  }
                </div>
                <div>
                  <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '11px', fontWeight: 600, letterSpacing: '.04em' }}>{vaga.company}</div>
                  {vaga.location && <div style={{ fontSize: '11px', color: 'var(--mt)' }}>📍 {vaga.location}</div>}
                </div>
              </div>

              {/* Cargo */}
              <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '14px', lineHeight: 1.35, color: 'var(--tx)' }}>
                {vaga.title}
              </div>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {vaga.employment_type && (
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 8px', border: `1px solid ${TIPO_COR[vaga.employment_type.toLowerCase()] ?? 'rgba(91,200,255,.3)'}`, color: 'var(--cy)', letterSpacing: '.06em' }}>
                    {vaga.employment_type.toUpperCase()}
                  </span>
                )}
                {vaga.salary && (
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 8px', border: '1px solid rgba(34,197,94,.3)', color: '#22c55e', letterSpacing: '.06em' }}>
                    {vaga.salary}
                  </span>
                )}
              </div>

              {/* Descrição */}
              {vaga.description && (
                <div style={{ fontSize: '12px', color: 'var(--mt)', lineHeight: 1.55, flex: 1, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {vaga.description}
                </div>
              )}

              {/* Rodapé */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--bdr)' }}>
                {vaga.date_posted && (
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                    {new Date(vaga.date_posted).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </span>
                )}
                <a href={vaga.url} target="_blank" rel="noopener noreferrer" style={{
                  padding: '5px 14px', fontFamily: 'var(--font-m)', fontSize: '10px',
                  letterSpacing: '.08em', color: 'var(--cy)',
                  border: '1px solid rgba(91,200,255,.4)', background: 'rgba(91,200,255,.06)',
                  textDecoration: 'none',
                }}>
                  VER VAGA →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
