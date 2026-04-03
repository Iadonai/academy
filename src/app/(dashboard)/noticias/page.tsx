import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 43200 // atualiza a cada 12 horas

interface Artigo {
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  source: { name: string }
  author: string | null
}

async function buscarNoticias(): Promise<Artigo[]> {
  const key = process.env.NEWS_API_KEY
  if (!key) return []

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?category=technology&language=pt&pageSize=20&apiKey=${key}`,
      { next: { revalidate: 43200 } }
    )

    if (!res.ok) {
      // fallback para inglês se não houver notícias em português
      const resEn = await fetch(
        `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=20&apiKey=${key}`,
        { next: { revalidate: 43200 } }
      )
      if (!resEn.ok) return []
      const dataEn = await resEn.json()
      return dataEn.articles ?? []
    }

    const data = await res.json()
    const artigos = data.articles ?? []

    // Se não tiver artigos em PT, busca em inglês
    if (artigos.length === 0) {
      const resEn = await fetch(
        `https://newsapi.org/v2/top-headlines?category=technology&language=en&pageSize=20&apiKey=${key}`,
        { next: { revalidate: 43200 } }
      )
      if (!resEn.ok) return []
      const dataEn = await resEn.json()
      return dataEn.articles ?? []
    }

    return artigos
  } catch {
    return []
  }
}

export default async function NoticiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const artigos = await buscarNoticias()
  const agora = new Date()

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>
            // FEED
          </div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em', marginBottom: '4px' }}>
            NOTÍCIAS DE TECNOLOGIA
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt)' }} suppressHydrationWarning>
            Atualizado em {agora.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>
        <div className="hero-hex" style={{ fontSize: '12px' }}>NEWS</div>
      </div>

      {artigos.length === 0 ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>
            CARREGANDO NOTÍCIAS...
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          {artigos
            .filter((a) => a.title && a.title !== '[Removed]')
            .map((artigo, i) => (
              <a
                key={i}
                href={artigo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                <div className="punk-card" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'border-color .2s' }}>
                  <div style={{ borderTop: '2px solid var(--cy)' }} />

                  {/* Imagem */}
                  {artigo.urlToImage ? (
                    <div style={{ height: '160px', overflow: 'hidden', background: 'var(--s3)' }}>
                      <img
                        src={artigo.urlToImage}
                        alt={artigo.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '80px', background: 'var(--s3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-h)', fontSize: '28px', color: 'var(--cy)', opacity: .2 }}>⚡</span>
                    </div>
                  )}

                  <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Fonte */}
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                      // {artigo.source.name}
                    </div>

                    {/* Título */}
                    <div className="post-title" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {artigo.title}
                    </div>

                    {/* Descrição */}
                    {artigo.description && (
                      <div style={{ fontSize: '12px', color: 'var(--mt)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                        {artigo.description}
                      </div>
                    )}

                    {/* Data */}
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: 'auto', letterSpacing: '.04em' }} suppressHydrationWarning>
                      {new Date(artigo.publishedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </a>
            ))}
        </div>
      )}
    </div>
  )
}
