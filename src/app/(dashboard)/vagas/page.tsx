import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 43200 // atualiza a cada 12 horas

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

const KEYWORDS = ['automation', 'n8n', 'data', 'python', 'inteligência artificial', 'machine learning', 'analytics', 'RPA', 'low-code', 'no-code', 'BI', 'power bi', 'AI']

async function buscarVagas(): Promise<Vaga[]> {
  const key = process.env.RAPIDAPI_KEY
  if (!key) return []

  try {
    const res = await fetch(
      'https://linkedin-job-search-api.p.rapidapi.com/active-jb-1h?limit=100&offset=0&description_type=text',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-host': 'linkedin-job-search-api.p.rapidapi.com',
          'x-rapidapi-key': key,
        },
        next: { revalidate: 43200 },
      }
    )

    if (!res.ok) return []

    const data = await res.json()
    const vagas: Vaga[] = Array.isArray(data) ? data : (data.jobs ?? data.data ?? [])

    // Filtra por palavras-chave relevantes ao nicho
    return vagas.filter((v) => {
      const texto = `${v.title} ${v.description ?? ''}`.toLowerCase()
      return KEYWORDS.some((k) => texto.includes(k.toLowerCase()))
    }).slice(0, 30)
  } catch {
    return []
  }
}

export default async function VagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const vagas = await buscarVagas()

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>
            // MERCADO
          </div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em', marginBottom: '4px' }}>
            VAGAS DE TECNOLOGIA
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt)' }}>
            Automação · Dados · IA · N8N · Python · Power BI
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{vagas.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// VAGAS</div>
        </div>
      </div>

      {vagas.length === 0 ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>
            CARREGANDO VAGAS...
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {vagas.map((vaga) => (
            <div key={vaga.id} className="punk-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Logo empresa */}
                <div style={{ width: '44px', height: '44px', background: 'var(--s3)', border: '1px solid var(--bdr)', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {vaga.company_logo ? (
                    <img src={vaga.company_logo} alt={vaga.company} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <span style={{ fontFamily: 'var(--font-h)', fontSize: '16px', color: 'var(--cy)', opacity: .4 }}>
                      {vaga.company?.[0]?.toUpperCase() ?? '?'}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <div className="post-title" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>
                        {vaga.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '12px', letterSpacing: '.04em' }}>
                          {vaga.company}
                        </span>
                        {vaga.location && (
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>
                            📍 {vaga.location}
                          </span>
                        )}
                        {vaga.employment_type && (
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 7px', border: '1px solid rgba(91,200,255,.3)', color: 'var(--cy)', letterSpacing: '.06em' }}>
                            {vaga.employment_type.toUpperCase()}
                          </span>
                        )}
                        {vaga.salary && (
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 7px', border: '1px solid rgba(34,197,94,.3)', color: '#22c55e', letterSpacing: '.06em' }}>
                            {vaga.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={vaga.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 16px', fontFamily: 'var(--font-m)', fontSize: '10px',
                        letterSpacing: '.1em', color: 'var(--cy)',
                        border: '1px solid rgba(91,200,255,.4)',
                        background: 'rgba(91,200,255,.06)', textDecoration: 'none',
                        whiteSpace: 'nowrap', flexShrink: 0,
                      }}
                    >
                      VER VAGA →
                    </a>
                  </div>

                  {/* Descrição resumida */}
                  {vaga.description && (
                    <div style={{ fontSize: '12px', color: 'var(--mt)', lineHeight: 1.6, marginTop: '10px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {vaga.description}
                    </div>
                  )}

                  {/* Data */}
                  {vaga.date_posted && (
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: '8px', letterSpacing: '.04em' }}>
                      Publicada em {new Date(vaga.date_posted).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
