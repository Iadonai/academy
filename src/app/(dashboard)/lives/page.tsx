import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { youtubeEmbedUrl } from '@/lib/youtube'

export default async function LivesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  const isAdmin = perfil?.role === 'ADMIN'

  const agora = new Date()

  const lives = await prisma.liveEvent.findMany({
    where: { published: true },
    orderBy: { scheduledAt: 'asc' },
  })

  const proximas = lives.filter((l) => new Date(l.scheduledAt) > agora)
  const passadas = lives.filter((l) => new Date(l.scheduledAt) <= agora).reverse()

  // Live acontecendo agora = agendada há menos de 4h
  const aoVivo = passadas.find((l) => {
    const diff = agora.getTime() - new Date(l.scheduledAt).getTime()
    return diff < 4 * 60 * 60 * 1000
  })

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner" style={{ marginBottom: '20px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(91,200,255,.08)', border: '1px solid rgba(91,200,255,.25)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>
            // TRANSMISSÕES
          </div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '18px', fontWeight: 900, letterSpacing: '.06em', marginBottom: '4px' }}>
            LIVES & EVENTOS
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt)' }}>
            Aulas ao vivo, Q&A e eventos especiais
          </div>
        </div>
        {isAdmin && (
          <Link href="/admin/lives" className="btn-punk">+ AGENDAR LIVE</Link>
        )}
      </div>

      {/* Player ao vivo */}
      {aoVivo && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444' }} />
            <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: '#ef4444', letterSpacing: '.1em' }}>AO VIVO AGORA</span>
          </div>
          <div className="punk-card" style={{ overflow: 'hidden' }}>
            <div style={{ borderTop: '2px solid #ef4444' }} />
            <div style={{ aspectRatio: '16/9' }}>
              <iframe
                src={`${youtubeEmbedUrl(aoVivo.youtubeUrl)}?autoplay=1`}
                style={{ width: '100%', height: '100%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div style={{ padding: '14px' }}>
              <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '15px', letterSpacing: '.06em' }}>{aoVivo.title}</div>
              {aoVivo.description && <div style={{ fontSize: '13px', color: 'var(--mt)', marginTop: '4px' }}>{aoVivo.description}</div>}
            </div>
          </div>
        </div>
      )}

      <div className={lives.length > 0 ? 'page-main-sidebar-300' : undefined}>
        <div>
          {/* Próximas lives */}
          {proximas.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '14px' }}>// PRÓXIMAS LIVES</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {proximas.map((live) => (
                  <div key={live.id} className="punk-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'center', minWidth: '56px' }}>
                      <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px', lineHeight: 1 }}>
                        {new Date(live.scheduledAt).getDate()}
                      </div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.06em' }}>
                        {new Date(live.scheduledAt).toLocaleString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' }).toUpperCase()}
                      </div>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: 'var(--bdr)' }} />
                    <div style={{ flex: 1 }}>
                      <div className="silver" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>{live.title}</div>
                      {live.description && <div style={{ fontSize: '12px', color: 'var(--mt)' }}>{live.description}</div>}
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', marginTop: '4px', letterSpacing: '.06em' }}>
                        {new Date(live.scheduledAt).toLocaleString('pt-BR', { weekday: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).toUpperCase()}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(91,200,255,.1)', border: '1px solid rgba(91,200,255,.3)', padding: '4px 10px', fontFamily: 'var(--font-m)', fontSize: '9px', color: 'var(--cy)', letterSpacing: '.1em' }}>
                      EM BREVE
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lives passadas */}
          {passadas.filter((l) => l.id !== aoVivo?.id).length > 0 && (
            <div>
              <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '14px' }}>// GRAVAÇÕES ANTERIORES</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                {passadas.filter((l) => l.id !== aoVivo?.id).map((live) => {
                  const embed = youtubeEmbedUrl(live.youtubeUrl)
                  return (
                    <div key={live.id} className="punk-card" style={{ overflow: 'hidden' }}>
                      <div style={{ borderTop: '2px solid var(--cy)' }} />
                      {embed && (
                        <div style={{ aspectRatio: '16/9' }}>
                          <iframe src={embed} style={{ width: '100%', height: '100%' }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen />
                        </div>
                      )}
                      <div style={{ padding: '12px' }}>
                        <div className="silver" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>{live.title}</div>
                        <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.04em' }}>
                          {new Date(live.scheduledAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {lives.length === 0 && (
            <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '60px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>
                NENHUMA LIVE AGENDADA AINDA.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar calendário simples */}
        {lives.length > 0 && (
          <div>
            <div className="rank-box">
              <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '12px' }}>// AGENDA</div>
              {[...proximas, ...passadas].slice(0, 8).map((live) => {
                const isPast = new Date(live.scheduledAt) <= agora
                return (
                  <div key={live.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid rgba(42,26,80,.6)' }}>
                    <div style={{ fontFamily: 'var(--font-h)', fontSize: '18px', color: isPast ? 'var(--mt)' : 'var(--cy)', lineHeight: 1, minWidth: '28px' }}>
                      {new Date(live.scheduledAt).getDate()}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: isPast ? 'var(--mt)' : 'var(--tx)', fontWeight: 600 }}>{live.title}</div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginTop: '2px' }}>
                        {new Date(live.scheduledAt).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}h
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
