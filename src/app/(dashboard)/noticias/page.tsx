import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 21600 // 6 horas

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
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return []
    const xml = await res.text()
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []

    return items.slice(0, 8).map((item) => {
      const get = (tag: string) => {
        const m = item.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
        return m ? m[1].trim().replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#\d+;/g, '') : ''
      }
      const imgMatch = item.match(/url="([^"]+\.(jpg|jpeg|png|webp)[^"]*)"/i)
        ?? item.match(/<media:content[^>]+url="([^"]+)"/i)
        ?? item.match(/<enclosure[^>]+url="([^"]+)"/i)

      return {
        title: get('title'),
        description: get('description').slice(0, 220),
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
    { url: 'https://rss.tecmundo.com.br/feed', nome: 'Tecmundo' },
    { url: 'https://olhardigital.com.br/feed/', nome: 'Olhar Digital' },
    { url: 'https://canaltech.com.br/rss/', nome: 'Canaltech' },
    { url: 'https://tiinside.com.br/feed/', nome: 'TI Inside' },
    { url: 'https://feeds.feedburner.com/TechCrunch', nome: 'TechCrunch' },
    { url: 'https://www.artificialintelligence-news.com/feed/', nome: 'AI News' },
  ]

  const resultados = await Promise.allSettled(fontes.map((f) => buscarRSS(f.url, f.nome)))

  const artigos = resultados
    .flatMap((r) => r.status === 'fulfilled' ? r.value : [])
    .filter((a) => a.title && a.publishedAt)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

  return artigos
}

export default async function NoticiasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const artigos = await buscarNoticias()
  const agora = new Date()

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>// FEED AO VIVO</div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em' }}>NOTÍCIAS DE TECNOLOGIA</div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>Tecmundo · Olhar Digital · Canaltech · TI Inside · TechCrunch · AI News</div>
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
          {artigos.map((artigo, i) => {
            const minutosAtras = Math.round((agora.getTime() - new Date(artigo.publishedAt).getTime()) / 60000)
            const tempo = minutosAtras < 60
              ? `${minutosAtras}min atrás`
              : minutosAtras < 1440
              ? `${Math.round(minutosAtras / 60)}h atrás`
              : new Date(artigo.publishedAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

            return (
              <div key={i} style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)', display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em' }}>// {artigo.source.toUpperCase()}</span>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: minutosAtras < 120 ? '#22c55e' : 'var(--mt)' }} suppressHydrationWarning>{tempo}</span>
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
            )
          })}
        </div>
      )}
    </div>
  )
}
