import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { responderPost } from '@/app/actions/forum'
import { BotaoCurtir } from '@/components/forum/BotaoCurtir'
import { BotaoDeletarPost, BotaoDeletarResposta } from '@/components/forum/BotaoDeletarPost'
import { youtubeEmbedUrl } from '@/lib/youtube'

export default async function PostPage({
  params,
}: {
  params: Promise<{ canalId: string; postId: string }>
}) {
  const { canalId, postId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [perfil, post] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, role: true } }),
    prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: { select: { name: true } },
        attachments: { orderBy: { createdAt: 'asc' } },
        likes: { select: { userId: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true } } },
        },
        channel: true,
      },
    }),
  ])

  if (!post || post.channelId !== canalId) notFound()

  const isAdmin = perfil?.role === 'ADMIN'
  const isAutorPost = post.userId === user.id
  const curtido = post.likes.some((l) => l.userId === user.id)
  const totalCurtidas = post.likes.length
  const imagens = post.attachments.filter((a) => a.type === 'IMAGE')
  const arquivos = post.attachments.filter((a) => a.type !== 'IMAGE')
  const embedUrl = post.videoUrl ? youtubeEmbedUrl(post.videoUrl) : null

  const iniciais = perfil?.name
    ? perfil.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
    : user.email?.[0].toUpperCase() ?? '?'

  const corAutor = ['var(--b2)', '#1B5E20', '#4527A0', 'var(--b1)', '#37474F'][
    post.user.name.charCodeAt(0) % 5
  ]

  return (
    <div style={{ padding: '16px 20px', maxWidth: '800px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontFamily: 'var(--font-m)', fontSize: '11px' }}>
        <Link href="/comunidade" style={{ color: 'var(--mt)', textDecoration: 'none' }}>COMUNIDADE</Link>
        <span style={{ color: 'var(--bdr)' }}>›</span>
        <Link href={`/comunidade/${canalId}`} style={{ color: 'var(--cy)', textDecoration: 'none' }}>#{post.channel.name}</Link>
      </div>

      {/* Post */}
      <div className="punk-card" style={{ marginBottom: '16px' }}>
        <div style={{ borderTop: '2px solid var(--cy)' }} />
        <div style={{ padding: '18px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="post-av" style={{ background: corAutor }}>{post.user.name.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="silver" style={{ fontFamily: 'var(--font-b)', fontWeight: 600, fontSize: '13px', letterSpacing: '.04em' }}>
                  {post.user.name.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                  // {new Date(post.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                </div>
              </div>
            </div>
            {(isAdmin || isAutorPost) && (
              <BotaoDeletarPost postId={post.id} channelId={canalId} />
            )}
          </div>

          {/* Título */}
          <div className="silver" style={{ fontFamily: 'var(--font-h)', fontSize: '16px', letterSpacing: '.06em', marginBottom: '12px', lineHeight: 1.3 }}>
            {post.title}
          </div>

          {/* Conteúdo */}
          <p style={{ fontSize: '14px', color: 'var(--tx)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: '14px' }}>
            {post.content}
          </p>

          {/* Vídeo */}
          {embedUrl && (
            <div style={{ aspectRatio: '16/9', marginBottom: '14px', border: '1px solid var(--bdr)' }}>
              <iframe src={embedUrl} style={{ width: '100%', height: '100%' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            </div>
          )}

          {/* Imagens */}
          {imagens.length > 0 && (
            <div style={{ display: 'grid', gap: '2px', gridTemplateColumns: imagens.length === 1 ? '1fr' : '1fr 1fr', marginBottom: '14px' }}>
              {imagens.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                  <img src={img.url} alt={img.name} style={{ width: '100%', objectFit: 'cover', maxHeight: imagens.length === 1 ? '320px' : '200px', cursor: 'zoom-in' }} />
                </a>
              ))}
            </div>
          )}

          {/* Arquivos */}
          {arquivos.length > 0 && (
            <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {arquivos.map((arq) => (
                <a key={arq.id} href={arq.url} target="_blank" rel="noopener noreferrer" download={arq.name}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--s3)', border: '1px solid var(--bdr)', padding: '10px 14px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '16px' }}>{arq.name.endsWith('.pdf') ? '📄' : '📎'}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-m)', fontSize: '12px', color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{arq.name}</span>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--cy)', letterSpacing: '.06em' }}>BAIXAR</span>
                </a>
              ))}
            </div>
          )}

          {/* Footer: curtir + comentários */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--bdr)' }}>
            <BotaoCurtir postId={post.id} channelId={canalId} total={totalCurtidas} curtido={curtido} />
            <span style={{ fontFamily: 'var(--font-m)', fontSize: '11px', color: 'var(--mt)' }}>
              💬 {post.replies.length} {post.replies.length === 1 ? 'COMENTÁRIO' : 'COMENTÁRIOS'}
            </span>
          </div>
        </div>
      </div>

      {/* Comentários */}
      <div className="section-title" style={{ fontFamily: 'var(--font-h)', fontSize: '11px', letterSpacing: '.12em', marginBottom: '14px' }}>
        // COMENTÁRIOS ({post.replies.length})
      </div>

      {post.replies.map((reply) => {
        const isAutorResposta = reply.userId === user.id
        const corReply = ['#4527A0', 'var(--b2)', '#1B5E20', 'var(--b1)', '#37474F'][
          reply.user.name.charCodeAt(0) % 5
        ]
        return (
          <div key={reply.id} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div className="post-av" style={{ background: corReply, width: '32px', height: '32px', fontSize: '9px' }}>
              {reply.user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="cmt-bubble" style={{ flex: 1, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <span className="silver" style={{ fontFamily: 'var(--font-m)', fontSize: '10px', letterSpacing: '.06em' }}>
                    // {reply.user.name.toUpperCase()}
                  </span>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mt)' }} suppressHydrationWarning>
                    {new Date(reply.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                  </span>
                </div>
                {(isAdmin || isAutorResposta) && (
                  <BotaoDeletarResposta replyId={reply.id} postId={postId} channelId={canalId} />
                )}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--tx)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{reply.content}</p>
            </div>
          </div>
        )
      })}

      {/* Form resposta */}
      <form action={responderPost} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <input type="hidden" name="postId" value={postId} />
        <input type="hidden" name="channelId" value={canalId} />
        <div className="post-av" style={{ background: 'var(--b1)', marginTop: '2px' }}>{iniciais}</div>
        <div style={{ flex: 1 }}>
          <textarea name="content" rows={3} required placeholder="Escreva seu comentário..."
            className="punk-textarea" style={{ border: '1px solid var(--bdr)', borderBottom: '1px solid var(--cy)', marginBottom: '8px' }} />
          <button type="submit" className="btn-punk">COMENTAR</button>
        </div>
      </form>
    </div>
  )
}
