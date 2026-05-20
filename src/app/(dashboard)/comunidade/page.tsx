import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function ComunidadePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfil, canais, posts] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, xpTotal: true, level: true, role: true } }),
    prisma.channel.findMany({ orderBy: { order: 'asc' } }),
    prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        user: { select: { name: true } },
        channel: { select: { name: true, id: true } },
        attachments: { where: { type: 'IMAGE' }, take: 4, orderBy: { createdAt: 'asc' } },
        _count: { select: { replies: true, likes: true } },
        replies: { take: 2, orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } },
      },
    }),
  ])

  const isAdmin = perfil?.role === 'ADMIN'
  const primeiroNome = perfil?.name?.split(' ')[0] ?? 'USUÁRIO'
  const iniciais = perfil?.name
    ? perfil.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const CORES = ['#5B2DB0', '#1B5E20', '#4527A0', '#1565C0', '#37474F']

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Hero */}
      <div className="hero-banner">
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', background: 'rgba(155,111,255,.1)', border: '1px solid rgba(155,111,255,.3)', padding: '3px 8px', letterSpacing: '.1em', marginBottom: '8px', display: 'inline-block' }}>
            // SISTEMA ATIVO
          </div>
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '20px', fontWeight: 900, letterSpacing: '.06em', marginBottom: '6px' }}>
            BEM-VINDO, {primeiroNome.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--mt)', letterSpacing: '.02em' }}>
            Comunidade IADONAI Academy
          </div>
          <div className="hero-stats">
            {[
              { v: perfil?.xpTotal ?? 0, l: '// XP TOTAL' },
              { v: perfil?.level ?? 1, l: '// NÍVEL' },
              { v: posts.length, l: '// POSTS' },
            ].map(({ v, l }) => (
              <div key={l}>
                <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '22px' }}>{v}</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', letterSpacing: '.08em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-hex">IA</div>
      </div>

      <div className="page-main-sidebar">
        {/* Feed */}
        <div>
          {/* Canais como tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
            <Link href="/comunidade" className="punk-tag active">TODOS</Link>
            {canais.map((canal) => (
              <Link key={canal.id} href={`/comunidade/${canal.id}`} className="punk-tag">{canal.name}</Link>
            ))}
            {isAdmin && (
              <Link href="/admin/comunidade" className="punk-tag" style={{ borderColor: 'rgba(201,162,39,.4)', color: 'var(--mg)' }}>+ CANAL</Link>
            )}
          </div>

          {/* Compose */}
          <Link href={canais[0] ? `/comunidade/${canais[0].id}/novo` : '#'} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)',
            padding: '12px 14px', marginBottom: '14px', textDecoration: 'none',
          }}>
            <div className="post-av" style={{ background: 'var(--b1)' }}>{iniciais}</div>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: '13px', color: 'var(--mt)', letterSpacing: '.04em' }}>
              // O QUE ESTÁ ACONTECENDO?
            </span>
          </Link>

          {/* Posts */}
          {posts.length === 0 ? (
            <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>NENHUMA PUBLICAÇÃO AINDA.</p>
            </div>
          ) : posts.map((post) => {
            const cor = CORES[post.user.name.charCodeAt(0) % CORES.length]
            return (
              <div key={post.id} className="punk-card punk-card-accent" style={{ marginBottom: '10px' }}>
                <div style={{ padding: '14px' }}>
                  {/* Cabeçalho */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                    <div className="post-av" style={{ background: cor }}>{post.user.name.slice(0, 2).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span className="silver" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '13px', letterSpacing: '.04em' }}>
                          {post.user.name.toUpperCase()}
                        </span>
                        <span style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 6px', border: '1px solid rgba(155,111,255,.3)', color: 'var(--cy)', background: 'rgba(155,111,255,.06)' }}>MBR</span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                        // {new Date(post.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: '9px', padding: '2px 8px', border: '1px solid rgba(155,111,255,.3)', color: 'var(--cy)' }}>
                      #{post.channel.name}
                    </div>
                  </div>

                  {/* Título e conteúdo */}
                  <Link href={`/comunidade/${post.channel.id}/${post.id}`} style={{ textDecoration: 'none' }}>
                    <div className="post-title" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '14px', marginBottom: '4px', paddingLeft: '44px' }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--mt)', lineHeight: 1.65, paddingLeft: '44px', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </div>
                  </Link>

                  {/* Imagens */}
                  {post.attachments.length > 0 && (
                    <Link href={`/comunidade/${post.channel.id}/${post.id}`} style={{ display: 'block', marginBottom: '10px' }}>
                      <div style={{ display: 'grid', gap: '2px', gridTemplateColumns: post.attachments.length === 1 ? '1fr' : '1fr 1fr' }}>
                        {post.attachments.slice(0, 4).map((img) => (
                          <img key={img.id} src={img.url} alt={img.name} style={{ width: '100%', objectFit: 'cover', height: post.attachments.length === 1 ? '220px' : '140px' }} />
                        ))}
                      </div>
                    </Link>
                  )}

                  {/* Footer */}
                  <div style={{ display: 'flex', gap: '16px', paddingLeft: '44px' }}>
                    <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>❤️ {post._count.likes}</span>
                    <Link href={`/comunidade/${post.channel.id}/${post.id}`} style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)', textDecoration: 'none' }}>
                      💬 {post._count.replies}
                    </Link>
                  </div>
                </div>

                {/* Comentários prévia */}
                {post.replies.length > 0 && (
                  <div style={{ padding: '10px 14px 10px 58px', borderTop: '1px solid var(--bdr)' }}>
                    {post.replies.map((reply) => (
                      <div key={reply.id} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                        <div className="small-av" style={{ background: 'var(--b1)' }}>{reply.user.name.slice(0, 2).toUpperCase()}</div>
                        <div className="cmt-bubble">
                          <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '10px', marginBottom: '2px', letterSpacing: '.06em' }}>// {reply.user.name.toUpperCase()}</div>
                          <div style={{ fontSize: '12px', color: 'var(--tx)' }}>{reply.content}</div>
                        </div>
                      </div>
                    ))}
                    {post._count.replies > 2 && (
                      <Link href={`/comunidade/${post.channel.id}/${post.id}`} style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--cy)', textDecoration: 'none' }}>
                        VER TODOS OS {post._count.replies} COMENTÁRIOS →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Sidebar */}
        <div>
          <div className="rank-box" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '12px' }}>// CANAIS</div>
            {canais.length === 0
              ? <p style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>Nenhum canal ainda.</p>
              : canais.map((canal) => (
                <Link key={canal.id} href={`/comunidade/${canal.id}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid rgba(42,26,80,.8)', textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: 'var(--cy)' }}>#</span>
                  <span className="silver" style={{ flex: 1, fontSize: '12px', fontWeight: 600 }}>{canal.name}</span>
                </Link>
              ))
            }
            {isAdmin && (
              <Link href="/admin/comunidade" className="btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: '10px', textDecoration: 'none' }}>+ GERENCIAR</Link>
            )}
          </div>

          <div style={{ background: 'var(--s2)', border: '1px solid var(--bdr)', borderTop: '2px solid var(--cy)', padding: '14px' }}>
            <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.1em', marginBottom: '10px' }}>// SUPORTE</div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)', marginBottom: '10px', letterSpacing: '.04em' }}>Nossa equipe está online.</div>
            <button className="btn-punk" style={{ width: '100%', justifyContent: 'center' }}>ABRIR SUPORTE</button>
          </div>
        </div>
      </div>
    </div>
  )
}
