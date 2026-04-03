import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface Artigo {
  title: string
  description: string
  url: string
  image: string | null
  publishedAt: string
  source: string
}

async function buscarRSS(url: string, fonte: string): Promise<Artigo[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } })
    const xml = await res.text()

    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    return items.slice(0, 10).map((item) => {
      const get = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
        return m ? m[1].trim() : ''
      }
      const imgMatch = item.match(/url="([^"]+\.(jpg|png|webp))"/i) || item.match(/<media:content[^>]+url="([^"]+)"/i) || item.match(/<enclosure[^>]+url="([^"]+)"/i)
      return {
        title: get('title').replace(/<[^>]+>/g, ''),
        description: get('description').replace(/<[^>]+>/g, '').slice(0, 200),
        url: get('link') || get('guid'),
        image: imgMatch ? imgMatch[1] : null,
        publishedAt: get('pubDate'),
        source: fonte,
      }
    }).filter((a) => a.title && a.url)
  } catch {
    return []
  }
}

async function buscarNoticias(): Promise<Artigo[]> {
  const fontes = [
    { url: 'https://www.tecmundo.com.br/rss', nome: 'Tecmundo' },
    { url: 'https://canaltech.com.br/rss/', nome: 'Canaltech' },
    { url: 'https://feeds.feedburner.com/TechCrunch', nome: 'TechCrunch' },
  ]

  const resultados = await Promise.allSettled(fontes.map((f) => buscarRSS(f.url, f.nome)))

  return resultados
    .flatMap((r) => r.status === 'fulfilled' ? r.value : [])
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
}

export default async function NoticiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const artigos = await buscarNoticias()

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// FEED</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>NOTÍCIAS DE TECNOLOGIA</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Tecmundo · Canaltech · TechCrunch</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '28px' }}>{artigos.length}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>// ARTIGOS</div>
        </div>
      </div>

      {artigos.length === 0 ? (
        <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>CARREGANDO NOTÍCIAS...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {artigos.map((artigo, i) => (
            <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)', display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em' }}>// {artigo.source.toUpperCase()}</span>
                {artigo.publishedAt && (
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                    {new Date(artigo.publishedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </span>
                )}
              </div>
              {artigo.image && (
                <div style={{ height: '130px', overflow: 'hidden' }}>
                  <img src={artigo.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', lineHeight: 1.4, color: 'var(--tx)' }}>{artigo.title}</div>
              {artigo.description && (
                <div style={{ fontSize: '12px', color: 'var(--mt)', lineHeight: 1.55, flex: 1 }}>{artigo.description}</div>
              )}
              <a href={artigo.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 'auto', display: 'inline-block', padding: '5px 12px', fontFamily: 'var(--font-m)', fontSize: '10px', letterSpacing: '.08em', color: 'var(--cy)', border: '1px solid rgba(91,200,255,.3)', background: 'rgba(91,200,255,.05)', textDecoration: 'none', alignSelf: 'flex-start' }}>
                LER MATÉRIA →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
