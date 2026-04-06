import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600 // 1 hora

interface Pergunta {
  question_id: number
  title: string
  link: string
  score: number
  answer_count: number
  view_count: number
  is_answered: boolean
  tags: string[]
  owner: { display_name: string; profile_image?: string }
  creation_date: number
}

const CATEGORIAS = [
  { label: 'Python', tag: 'python', cor: '#3b82f6' },
  { label: 'Power BI', tag: 'powerbi', cor: '#f59e0b' },
  { label: 'Pandas / Dados', tag: 'pandas', cor: '#22c55e' },
  { label: 'Machine Learning', tag: 'machine-learning', cor: '#a855f7' },
  { label: 'Automação / RPA', tag: 'automation', cor: 'var(--cy)' },
  { label: 'N8N', tag: 'n8n', cor: '#ef4444' },
]

async function buscarPerguntas(tag: string): Promise<Pergunta[]> {
  try {
    const res = await fetch(
      `https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&tagged=${tag}&site=stackoverflow&pagesize=6`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

function formatNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function tempoAtras(unix: number) {
  const diff = Math.floor((Date.now() / 1000) - unix)
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export default async function StackPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resultados = await Promise.all(
    CATEGORIAS.map((cat) => buscarPerguntas(cat.tag))
  )

  const totalPerguntas = resultados.reduce((acc, r) => acc + r.length, 0)

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '28px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// STACK OVERFLOW</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>PERGUNTAS EM ALTA</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Python · Power BI · Pandas · ML · Automação · N8N — dúvidas reais do mercado</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{totalPerguntas}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// PERGUNTAS</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {CATEGORIAS.map((cat, ci) => (
          <div key={cat.tag}>
            {/* Cabeçalho da categoria */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '3px', height: '18px', background: cat.cor }} />
              <div style={{ fontFamily: 'var(--font-h)', fontSize: '13px', letterSpacing: '.08em', color: cat.cor }}>{cat.label.toUpperCase()}</div>
              <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }} />
              <a
                href={`https://stackoverflow.com/questions/tagged/${cat.tag}?sort=hot`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.08em', textDecoration: 'none' }}
              >
                VER MAIS →
              </a>
            </div>

            {resultados[ci].length === 0 ? (
              <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '24px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>Nenhuma pergunta encontrada</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {resultados[ci].map((q) => (
                  <a
                    key={q.question_id}
                    href={q.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '12px 14px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${q.is_answered ? '#22c55e' : cat.cor}` }}
                  >
                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '48px', paddingTop: '2px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '14px', lineHeight: 1 }}>{q.score}</div>
                        <div style={{ fontFamily: 'var(--font-m)', fontSize: '8px', color: 'var(--mt)', letterSpacing: '.06em' }}>votos</div>
                      </div>
                      <div style={{
                        padding: '2px 6px',
                        fontFamily: 'var(--font-m)', fontSize: '8px', letterSpacing: '.06em',
                        color: q.is_answered ? '#22c55e' : 'var(--mt)',
                        border: `1px solid ${q.is_answered ? 'rgba(34,197,94,.4)' : 'var(--bdr)'}`,
                        background: q.is_answered ? 'rgba(34,197,94,.08)' : 'transparent',
                      }}>
                        {q.answer_count} resp
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', color: 'var(--tx)', lineHeight: 1.4, marginBottom: '8px' }}
                        dangerouslySetInnerHTML={{ __html: q.title }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {q.tags.slice(0, 4).map((t) => (
                          <span key={t} style={{ fontFamily: 'var(--font-m)', fontSize: '8px', padding: '1px 6px', border: '1px solid var(--bdr)', color: 'var(--mt)' }}>{t}</span>
                        ))}
                        <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', marginLeft: 'auto' }}>
                          👁 {formatNum(q.view_count)} · {tempoAtras(q.creation_date)}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
