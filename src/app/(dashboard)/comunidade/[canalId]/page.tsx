import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function CanalPage({
  params,
}: {
  params: Promise<{ canalId: string }>
}) {
  const { canalId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, role: true } })
  const isAdmin = perfil?.role === 'ADMIN'
  const iniciais = perfil?.name
    ? perfil.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const [canal, canais] = await Promise.all([
    prisma.channel.findUnique({
      where: { id: canalId },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { name: true } },
            attachments: { where: { type: 'IMAGE' }, take: 4, orderBy: { createdAt: 'asc' } },
            _count: { select: { replies: true, likes: true } },
            replies: { take: 2, orderBy: { createdAt: 'asc' }, include: { user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.channel.findMany({ orderBy: { order: 'asc' } }),
  ])

  if (!canal) notFound()

  return (
    <div style={{ padding: '16px 20px' }}>
      <div className="page-main-sidebar">
        {/* Feed */}
        <div>
          {/* Tags de canais */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '14px' }}>
            <Link href="/comunidade" className="punk-tag">TODOS</Link>
            {canais.map((c) => (
              <Link key={c.id} href={`/comunidade/${c.id}`} className={`punk-tag${c.id === canalId ? ' active' : ''}`}>
                {c.name}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/comunidade" className="punk-tag" style={{ borderColor: 'rgba(255,107,53,.3)', color: 'var(--mg)' }}>
                + CANAL
              </Link>
            )}
          </div>

          {/* Header + botão novo post */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-h)', fontSize: '14px', color: 'var(--cy)', letterSpacing: '.1em' }}>
                # {canal.name}
              </span>
              {canal.description && (
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)', marginLeft: '10px', letterSpacing: '.04em' }}>
                  — {canal.description}
                </span>
              )}
            </div>
            <Link href={`/comunidade/${canalId}/novo`} className="btn-punk">+ PUBLICAR</Link>
          </div>

          {/* Compose bar */}
          <Link
            href={`/comunidade/${canalId}/novo`}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--s2)', border: '1px solid var(--bdr)', borderLeft: '3px solid var(--cy)',
              padding: '12px 14px', marginBottom: '14px', textDecoration: 'none',
            }}
          >
            <div className="post-av" style={{ background: 'var(--b1)' }}>{iniciais}</div>
            <span style={{ fontFamily: 'var(--font-b)', fontSize: '13px', color: 'var(--mt)', letterSpacing: '.04em' }}>
              // O QUE ESTÁ ACONTECENDO?
            </span>
          </Link>

          {/* Posts */}
          {canal.posts.length === 0 ? (
            <div style={{ background: 'var(--s2)', border: '1px dashed var(--bdr)', padding: '48px 20px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-m)', color: 'var(--mt)', fontSize: '12px', letterSpacing: '.06em' }}>
                NENHUMA PUBLICAÇÃO AINDA. SEJA O PRIMEIRO!
              </p>
            </div>
          ) : (
            canal.posts.map((post) => {
              const cor = ['var(--b2)', '#1B5E20', '#4527A0', 'var(--b1)', '#37474F'][
                post.user.name.charCodeAt(0) % 5
              ]
              return (
                <div key={post.id} className="punk-card punk-card-accent" style={{ marginBottom: '10px' }}>
                  <div style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                      <div className="post-av" style={{ background: cor }}>{post.user.name.slice(0, 2).toUpperCase()}</div>
                      <div style={{ flex: 1 }}>
                        <div className="silver" style={{ fontFamily: 'var(--font-b)', fontWeight: 600, fontSize: '13px', letterSpacing: '.04em' }}>
                          {post.user.name.toUpperCase()}
                        </div>
                        <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                          // {new Date(post.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                        </div>
                      </div>
                    </div>

                    <Link href={`/comunidade/${canalId}/${post.id}`} style={{ textDecoration: 'none' }}>
                      <div className="post-title" style={{ fontFamily: 'var(--font-b)', fontWeight: 700, fontSize: '14px', marginBottom: '4px', paddingLeft: '44px' }}>
                        {post.title}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--mt)', lineHeight: 1.65, paddingLeft: '44px', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {post.content}
                      </div>
                    </Link>

                    {/* Imagens */}
                    {post.attachments.length > 0 && (
                      <Link href={`/comunidade/${canalId}/${post.id}`} style={{ display: 'block', marginBottom: '10px' }}>
                        <div style={{ display: 'grid', gap: '2px', gridTemplateColumns: post.attachments.length === 1 ? '1fr' : '1fr 1fr' }}>
                          {post.attachments.slice(0, 4).map((img) => (
                            <img key={img.id} src={img.url} alt={img.name} style={{ width: '100%', objectFit: 'cover', height: post.attachments.length === 1 ? '220px' : '140px' }} />
                          ))}
                        </div>
                      </Link>
                    )}

                    <div style={{ display: 'flex', gap: '16px', paddingLeft: '44px' }}>
                      <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>❤️ {post._count.likes}</span>
                      <Link href={`/comunidade/${canalId}/${post.id}`} style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)', textDecoration: 'none' }}>
                        💬 {post._count.replies}
                      </Link>
                    </div>
                  </div>

                  {post.replies.length > 0 && (
                    <div style={{ padding: '10px 14px 10px 58px', borderTop: '1px solid var(--bdr)' }}>
                      {post.replies.map((reply) => (
                        <div key={reply.id} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                          <div className="small-av" style={{ background: 'var(--b1)' }}>{reply.user.name.slice(0, 2).toUpperCase()}</div>
                          <div className="cmt-bubble">
                            <div className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '10px', marginBottom: '2px', letterSpacing: '.06em' }}>
                              // {reply.user.name.toUpperCase()}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--mt)' }}>{reply.content}</div>
                          </div>
                        </div>
                      ))}
                      {post._count.replies > 2 && (
                        <Link href={`/comunidade/${canalId}/${post.id}`} style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--cy)', textDecoration: 'none' }}>
                          VER TODOS OS {post._count.replies} COMENTÁRIOS →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="rank-box" style={{ marginBottom: '14px' }}>
            <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '12px' }}>// CANAIS</div>
            {canais.map((c) => (
              <Link key={c.id} href={`/comunidade/${c.id}`} style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0',
                borderBottom: '1px solid rgba(17,32,64,.8)', textDecoration: 'none',
                color: c.id === canalId ? 'var(--cy)' : 'var(--tx)',
              }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: '12px', color: 'var(--cy)' }}>#</span>
                <span className="silver" style={{ flex: 1, fontSize: '12px', fontWeight: 600 }}>{c.name}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin/comunidade" className="btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: '10px', textDecoration: 'none' }}>
                + GERENCIAR
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
