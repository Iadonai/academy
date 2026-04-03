import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 604800 // 1 semana

interface Vaga {
  id: string
  title: string
  company: string
  location: string
  url: string
  date: string
  type: string
  source: string
  logo: string | null
}

const TERMOS_JSEARCH = [
  'python brasil',
  'dados brasil',
  'automacao brasil',
  'power bi brasil',
  'machine learning brasil',
  'inteligencia artificial brasil',
  'n8n brasil',
  'rpa brasil',
  'analytics brasil',
]

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? ''

async function buscarJSearch(): Promise<Vaga[]> {
  try {
    const resultados = await Promise.allSettled(
      TERMOS_JSEARCH.map((termo) =>
        fetch(
          `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(termo)}&page=1&num_pages=1&country=br&date_posted=all`,
          {
            headers: {
              'x-rapidapi-host': 'jsearch.p.rapidapi.com',
              'x-rapidapi-key': RAPIDAPI_KEY,
              'Content-Type': 'application/json',
            },
            next: { revalidate: 604800 },
          }
        ).then((r) => r.json())
      )
    )

    const vistos = new Set<string>()
    const vagas: Vaga[] = []

    for (const r of resultados) {
      if (r.status !== 'fulfilled') continue
      const jobs: Record<string, unknown>[] = r.value?.data ?? []
      for (const j of jobs) {
        const id = j.job_id as string
        if (!id || vistos.has(id)) continue
        vistos.add(id)

        const cidade = j.job_city as string | null
        const estado = j.job_state as string | null
        const remoto = j.job_is_remote as boolean
        const location = cidade
          ? `${cidade}${estado ? `, ${estado}` : ''}`
          : remoto
          ? 'Remoto'
          : 'Brasil'

        const empType = (j.job_employment_type as string | null)?.toLowerCase() ?? ''
        const type = remoto ? 'remote' : empType

        vagas.push({
          id: `js-${id}`,
          title: (j.job_title as string) ?? '',
          company: (j.employer_name as string) ?? '',
          location,
          url: (j.job_apply_link as string) ?? (j.job_google_link as string) ?? '',
          date: (j.job_posted_at_datetime_utc as string) ?? '',
          type,
          source: 'JSearch',
          logo: (j.employer_logo as string | null) ?? null,
        })
      }
    }

    return vagas.slice(0, 60)
  } catch {
    return []
  }
}

async function buscarProgramathor(): Promise<Vaga[]> {
  try {
    const res = await fetch('https://programathor.com.br/feed', { next: { revalidate: 604800 } })
    if (!res.ok) return []
    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    const KEYWORDS = ['automação', 'dados', 'python', 'power bi', 'rpa', 'machine learning', 'data', 'analytics', 'n8n', 'bi', 'inteligência']

    return items.slice(0, 50).map((item, i) => {
      const get = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
        return m ? m[1].trim().replace(/<[^>]+>/g, '') : ''
      }
      return {
        id: `pt-${i}`,
        title: get('title'),
        company: get('author') || '',
        location: 'Brasil',
        url: get('link') || get('guid'),
        date: get('pubDate'),
        type: '',
        source: 'Programathor',
        logo: null,
      }
    }).filter((v) => {
      if (!v.title || !v.url) return false
      const texto = v.title.toLowerCase()
      return KEYWORDS.some((k) => texto.includes(k))
    })
  } catch {
    return []
  }
}

const TIPO_LABEL: Record<string, string> = {
  remote: 'REMOTO',
  hybrid: 'HÍBRIDO',
  on_site: 'PRESENCIAL',
  presential: 'PRESENCIAL',
  fulltime: 'CLT',
  contractor: 'PJ',
  parttime: 'PART-TIME',
  intern: 'ESTÁGIO',
}

const SOURCE_COR: Record<string, string> = {
  JSearch: 'var(--cy)',
  Programathor: '#22c55e',
}

export default async function VagasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [jsearch, programathor] = await Promise.all([buscarJSearch(), buscarProgramathor()])

  const vagas = [...jsearch, ...programathor]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// MERCADO BR</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>VAGAS DE TECH NO BRASIL</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>JSearch · Programathor · Automação · Dados · IA · Python · Power BI</div>
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
            <div key={vaga.id} style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: `3px solid ${SOURCE_COR[vaga.source] ?? 'var(--cy)'}`, display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px' }}>

              {/* Empresa */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', background: 'var(--s3)', border: '1px solid var(--bdr)', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {vaga.logo
                    ? <img src={vaga.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ fontFamily: 'var(--font-h)', fontSize: '14px', color: 'var(--cy)', opacity: .5 }}>{vaga.company?.[0]?.toUpperCase() ?? '?'}</span>
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vaga.company || '—'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', color: 'var(--mt)' }}>📍 {vaga.location}</span>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: '8px', padding: '1px 5px', color: SOURCE_COR[vaga.source] ?? 'var(--cy)', border: `1px solid ${SOURCE_COR[vaga.source] ?? 'var(--cy)'}`, opacity: .8 }}>{vaga.source.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Cargo */}
              <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.35, color: 'var(--tx)' }}>{vaga.title}</div>

              {/* Tipo */}
              {vaga.type && TIPO_LABEL[vaga.type] && (
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 8px', border: '1px solid rgba(91,200,255,.25)', color: 'var(--cy)', letterSpacing: '.06em', alignSelf: 'flex-start' }}>
                  {TIPO_LABEL[vaga.type]}
                </span>
              )}

              {/* Rodapé */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--bdr)' }}>
                {vaga.date ? (
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                    {new Date(vaga.date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </span>
                ) : <span />}
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
