import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Artigo {
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  source: { name: string }
}

async function buscarNoticias(): Promise<{ artigos: Artigo[]; erro: string | null }> {
  const key = process.env.NEWS_API_KEY
  if (!key) return { artigos: [], erro: 'API key não configurada' }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=tecnologia+automacao+python+inteligencia+artificial&language=pt&sortBy=publishedAt&pageSize=20&apiKey=${key}`,
      { cache: 'no-store' }
    )
    const data = await res.json()
    if (!res.ok) return { artigos: [], erro: data.message ?? `Erro ${res.status}` }
    const artigos = (data.articles ?? []).filter((a: Artigo) => a.title && a.title !== '[Removed]')
    return { artigos, erro: null }
  } catch (e) {
    return { artigos: [], erro: String(e) }
  }
}

export default async function NoticiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { artigos, erro } = await buscarNoticias()

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// FEED</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>NOTÍCIAS DE TECNOLOGIA</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{artigos.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// ARTIGOS</div>
        </div>
      </div>

      {erro && (
        <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', padding: '12px 16px', marginBottom: '16px', fontFamily: 'var(--font-m)', fontSize: '12px', color: '#f87171' }}>
          ⚠ {erro}
        </div>
      )}

      {artigos.length === 0 && !erro ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>SEM NOTÍCIAS NO MOMENTO.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {artigos.map((artigo, i) => (
            <div key={i} style={{
              background: 'var(--s2)',
              border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)',
              display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px',
            }}>
              {/* Fonte + data */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em' }}>
                  // {artigo.source.name.toUpperCase()}
                </span>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                  {new Date(artigo.publishedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </span>
              </div>

              {/* Imagem */}
              {artigo.urlToImage && (
                <div style={{ height: '140px', overflow: 'hidden', borderRadius: '2px' }}>
                  <img src={artigo.urlToImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Título */}
              <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.4, color: 'var(--tx)' }}>
                {artigo.title}
              </div>

              {/* Resumo */}
              {artigo.description && (
                <div style={{ fontSize: '12px', color: 'var(--mt)', lineHeight: 1.55, flex: 1, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {artigo.description}
                </div>
              )}

              {/* Botão */}
              <a href={artigo.url} target="_blank" rel="noopener noreferrer" style={{
                marginTop: 'auto', display: 'inline-block', padding: '5px 12px',
                fontFamily: 'var(--font-m)', fontSize: '10px', letterSpacing: '.08em',
                color: 'var(--cy)', border: '1px solid rgba(91,200,255,.3)',
                background: 'rgba(91,200,255,.05)', textDecoration: 'none', alignSelf: 'flex-start',
              }}>
                LER MATÉRIA →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
