import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Vaga {
  id: number
  title: string
  company_name: string
  candidate_required_location: string
  url: string
  publication_date: string
  description: string
  job_type: string
  salary: string
  company_logo: string
  tags: string[]
}

async function buscarVagas(): Promise<{ vagas: Vaga[]; erro: string | null }> {
  try {
    const res = await fetch(
      'https://remotive.com/api/remote-jobs?category=software-dev&limit=100',
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return { vagas: [], erro: `Erro ${res.status}` }
    const data = await res.json()
    const todas: Vaga[] = data.jobs ?? []

    const KEYWORDS = ['automation', 'n8n', 'data', 'python', 'machine learning', 'analytics', 'rpa', 'low-code', 'no-code', 'power bi', 'ai', 'artificial intelligence', 'automat', 'airflow', 'dbt', 'etl', 'pipeline']

    const filtradas = todas.filter((v) => {
      const texto = `${v.title} ${v.tags?.join(' ') ?? ''}`.toLowerCase()
      return KEYWORDS.some((k) => texto.includes(k))
    })

    return { vagas: filtradas.slice(0, 30), erro: null }
  } catch (e) {
    return { vagas: [], erro: String(e) }
  }
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
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>VAGAS REMOTAS DE TECH</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Automação · Dados · IA · Python · N8N · Power BI</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{vagas.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// VAGAS</div>
        </div>
      </div>

      {erro && (
        <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'var(--font-m)', fontSize: '12px', color: '#f87171' }}>⚠ {erro}</div>
      )}

      {vagas.length === 0 && !erro ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>SEM VAGAS NO MOMENTO.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {vagas.map((vaga) => (
            <div key={vaga.id} style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: '3px solid var(--cy)', display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px' }}>
              {/* Empresa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: 'var(--s3)', border: '1px solid var(--bdr)', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {vaga.company_logo
                    ? <img src={vaga.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontFamily: 'var(--font-h)', fontSize: '14px', color: 'var(--cy)', opacity: .5 }}>{vaga.company_name?.[0]?.toUpperCase() ?? '?'}</span>
                  }
                </div>
                <div>
                  <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '11px', fontWeight: 600, letterSpacing: '.04em' }}>{vaga.company_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--mt)' }}>🌐 {vaga.candidate_required_location || 'Remoto'}</div>
                </div>
              </div>

              {/* Cargo */}
              <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '14px', lineHeight: 1.35, color: 'var(--tx)' }}>{vaga.title}</div>

              {/* Tags */}
              {vaga.tags?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {vaga.tags.slice(0, 4).map((tag) => (
                    <span key={tag} style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 7px', border: '1px solid rgba(91,200,255,.25)', color: 'var(--cy)', letterSpacing: '.06em' }}>
                      {tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              )}

              {/* Salário */}
              {vaga.salary && (
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: '#22c55e', letterSpacing: '.04em' }}>💰 {vaga.salary}</div>
              )}

              {/* Rodapé */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--bdr)' }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                  {new Date(vaga.publication_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </span>
                <a href={vaga.url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 14px', fontFamily: 'var(--font-m)', fontSize: '10px', letterSpacing: '.08em', color: 'var(--cy)', border: '1px solid rgba(91,200,255,.4)', background: 'rgba(91,200,255,.06)', textDecoration: 'none' }}>
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
