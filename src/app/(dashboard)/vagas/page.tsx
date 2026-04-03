import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Vaga {
  id: string
  title: string
  company: string
  location: string
  url: string
  date: string
  description: string
  tags: string[]
  salary: string
  source: string
  logo: string | null
}

const KEYWORDS = ['automation', 'automação', 'n8n', 'dados', 'data', 'python', 'machine learning', 'analytics', 'rpa', 'low-code', 'no-code', 'power bi', 'bi', 'ai', 'inteligência artificial', 'airflow', 'etl', 'pipeline', 'tableau', 'sql']

async function buscarProgramathor(): Promise<Vaga[]> {
  try {
    const res = await fetch('https://programathor.com.br/feed', { next: { revalidate: 21600 } })
    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    return items.slice(0, 50).map((item, i) => {
      const get = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
        return m ? m[1].trim().replace(/<[^>]+>/g, '') : ''
      }
      return {
        id: `pt-${i}`,
        title: get('title'),
        company: get('author') || 'Empresa',
        location: 'Brasil',
        url: get('link') || get('guid'),
        date: get('pubDate'),
        description: get('description').slice(0, 300),
        tags: [],
        salary: '',
        source: 'Programathor',
        logo: null,
      }
    }).filter((v) => {
      if (!v.title || !v.url) return false
      const texto = `${v.title} ${v.description}`.toLowerCase()
      return KEYWORDS.some((k) => texto.includes(k))
    })
  } catch {
    return []
  }
}

async function buscarRemotivoBrasil(): Promise<Vaga[]> {
  try {
    const res = await fetch(
      'https://remotive.com/api/remote-jobs?category=software-dev&limit=100',
      { next: { revalidate: 21600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const todas = data.jobs ?? []

    return todas.filter((v: { title: string; tags: string[]; candidate_required_location: string }) => {
      const texto = `${v.title} ${v.tags?.join(' ') ?? ''}`.toLowerCase()
      const temKeyword = KEYWORDS.some((k) => texto.includes(k))
      const loc = (v.candidate_required_location ?? '').toLowerCase()
      const aceitaBrasil = loc.includes('brazil') || loc.includes('brasil') || loc.includes('latin') || loc.includes('south america') || loc.includes('worldwide') || loc.includes('anywhere') || loc === ''
      return temKeyword && aceitaBrasil
    }).slice(0, 20).map((v: { id: number; title: string; company_name: string; candidate_required_location: string; url: string; publication_date: string; description: string; tags: string[]; salary: string; company_logo: string }) => ({
      id: `rm-${v.id}`,
      title: v.title,
      company: v.company_name,
      location: v.candidate_required_location || 'Remoto / Worldwide',
      url: v.url,
      date: v.publication_date,
      description: v.description?.replace(/<[^>]+>/g, '').slice(0, 300) ?? '',
      tags: v.tags?.slice(0, 4) ?? [],
      salary: v.salary ?? '',
      source: 'Remotive',
      logo: v.company_logo ?? null,
    }))
  } catch {
    return []
  }
}

export default async function VagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [programathor, remotive] = await Promise.all([
    buscarProgramathor(),
    buscarRemotivoBrasil(),
  ])

  const vagas = [...programathor, ...remotive]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// MERCADO</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>VAGAS DE TECH NO BRASIL</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Programathor · Remotive · Automação · Dados · IA · Python</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{vagas.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// VAGAS</div>
        </div>
      </div>

      {vagas.length === 0 ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>CARREGANDO VAGAS...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {vagas.map((vaga) => (
            <div key={vaga.id} style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: `3px solid ${vaga.source === 'Programathor' ? '#22c55e' : 'var(--cy)'}`, display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px' }}>

              {/* Empresa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: 'var(--s3)', border: '1px solid var(--bdr)', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {vaga.logo
                    ? <img src={vaga.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontFamily: 'var(--font-h)', fontSize: '14px', color: 'var(--cy)', opacity: .5 }}>{vaga.company?.[0]?.toUpperCase() ?? '?'}</span>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '11px', fontWeight: 600, letterSpacing: '.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.company}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--mt)' }}>📍 {vaga.location}</span>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: '8px', padding: '1px 5px', background: vaga.source === 'Programathor' ? 'rgba(34,197,94,.1)' : 'rgba(91,200,255,.1)', color: vaga.source === 'Programathor' ? '#22c55e' : 'var(--cy)', border: `1px solid ${vaga.source === 'Programathor' ? 'rgba(34,197,94,.3)' : 'rgba(91,200,255,.3)'}` }}>
                      {vaga.source.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cargo */}
              <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.35, color: 'var(--tx)' }}>{vaga.title}</div>

              {/* Tags */}
              {vaga.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {vaga.tags.map((tag) => (
                    <span key={tag} style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 7px', border: '1px solid rgba(91,200,255,.25)', color: 'var(--cy)', letterSpacing: '.06em' }}>{tag.toUpperCase()}</span>
                  ))}
                </div>
              )}

              {/* Salário */}
              {vaga.salary && (
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: '#22c55e' }}>💰 {vaga.salary}</div>
              )}

              {/* Descrição */}
              {vaga.description && (
                <div style={{ fontSize: '12px', color: 'var(--mt)', lineHeight: 1.55, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{vaga.description}</div>
              )}

              {/* Rodapé */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--bdr)' }}>
                {vaga.date && (
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                    {new Date(vaga.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </span>
                )}
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
