import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 86400 // 24 horas

interface Repo {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  language: string | null
  topics: string[]
  owner: { avatar_url: string; login: string }
}

const CATEGORIAS = [
  { label: 'Python', query: 'topic:python+stars:>1000', cor: '#3b82f6' },
  { label: 'Automação / RPA', query: 'topic:automation+stars:>500', cor: 'var(--cy)' },
  { label: 'IA & Machine Learning', query: 'topic:machine-learning+stars:>2000', cor: '#a855f7' },
  { label: 'Dados & Analytics', query: 'topic:data-science+stars:>1000', cor: '#22c55e' },
  { label: 'N8N & Workflow', query: 'n8n+OR+workflow+automation+stars:>200', cor: '#f59e0b' },
]

async function buscarRepos(query: string): Promise<Repo[]> {
  try {
    const res = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=6`,
      {
        headers: { Accept: 'application/vnd.github+json' },
        next: { revalidate: 86400 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}

function formatStars(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default async function TrendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const resultados = await Promise.all(
    CATEGORIAS.map((cat) => buscarRepos(cat.query))
  )

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '28px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// GITHUB</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>REPOSITÓRIOS EM ALTA</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Python · Automação · IA · Dados · N8N — atualizado diariamente</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{CATEGORIAS.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// CATEGORIAS</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {CATEGORIAS.map((cat, ci) => (
          <div key={cat.label}>
            {/* Cabeçalho da categoria */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '3px', height: '18px', background: cat.cor }} />
              <div style={{ fontFamily: 'var(--font-h)', fontSize: '13px', letterSpacing: '.08em', color: cat.cor }}>{cat.label.toUpperCase()}</div>
              <div style={{ flex: 1, height: '1px', background: 'var(--bdr)' }} />
              <a
                href={`https://github.com/search?q=${encodeURIComponent(cat.query)}&sort=stars`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', letterSpacing: '.08em', textDecoration: 'none' }}
              >
                VER MAIS →
              </a>
            </div>

            {resultados[ci].length === 0 ? (
              <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '24px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>Nenhum resultado</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                {resultados[ci].map((repo) => (
                  <a
                    key={repo.id}
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px', background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: `3px solid ${cat.cor}` }}
                  >
                    {/* Autor e repo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={repo.owner.avatar_url} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid var(--bdr)' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--mt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.owner.login}</div>
                        <div className="silver" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{repo.name}</div>
                      </div>
                    </div>

                    {/* Descrição */}
                    {repo.description && (
                      <div style={{ fontSize: '11px', color: 'var(--mt)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {repo.description}
                      </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                      {repo.language && (
                        <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '1px 6px', border: `1px solid ${cat.cor}`, color: cat.cor, opacity: .8 }}>
                          {repo.language.toUpperCase()}
                        </span>
                      )}
                      <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }}>⭐ {formatStars(repo.stargazers_count)}</span>
                      <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }}>🍴 {formatStars(repo.forks_count)}</span>
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
