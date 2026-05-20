import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { youtubeEmbedUrl } from '@/lib/youtube'
import { BotaoConcluida } from '@/components/aula/BotaoConcluida'
import { Comentarios } from '@/components/aula/Comentarios'
import { NotasPessoais } from '@/components/aula/NotasPessoais'
import { PomodoroWidget } from '@/components/aula/PomodoroWidget'
import { AulaSidebar } from '@/components/aula/AulaSidebar'

const ICON: Record<string, string> = { VIDEO: '▶', PDF: '📄', QUIZ: '✏️' }
const LABEL: Record<string, string> = { VIDEO: 'Vídeo', PDF: 'Leitura', QUIZ: 'Quiz' }

export default async function AulaPage({
  params,
}: {
  params: Promise<{ cursoId: string; aulaId: string }>
}) {
  const { cursoId, aulaId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (perfil?.role !== 'ADMIN') {
    const [cursoDados, aulaDados] = await Promise.all([
      prisma.course.findUnique({ where: { id: cursoId }, select: { price: true } }),
      prisma.lesson.findUnique({ where: { id: aulaId }, select: { isPreview: true } }),
    ])
    if (Number(cursoDados?.price) !== 0 && !aulaDados?.isPreview) {
      const acesso = await prisma.courseAccess.findFirst({
        where: { userId: user.id, courseId: cursoId },
      })
      const assinatura = await prisma.subscription.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      })
      if (!acesso && !assinatura) redirect('/bloqueado')
    }
  }

  const [aula, progresses, nota] = await Promise.all([
    prisma.lesson.findUnique({
      where: { id: aulaId },
      include: {
        attachments: { orderBy: { createdAt: 'asc' } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, avatarUrl: true } } },
        },
        module: {
          include: {
            course: {
              include: {
                modules: {
                  orderBy: { order: 'asc' },
                  include: { lessons: { orderBy: { order: 'asc' } } },
                },
              },
            },
          },
        },
        lessonProgresses: {
          where: { userId: user.id },
          select: { completedAt: true },
        },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id },
      select: { lessonId: true },
    }),
    prisma.note.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId: aulaId } },
      select: { content: true },
    }),
  ])

  if (!aula || aula.module.courseId !== cursoId) notFound()

  const concluida = aula.lessonProgresses.length > 0
  const embedUrl = youtubeEmbedUrl(aula.youtubeUrl)
  const curso = aula.module.course
  const todasAulas = curso.modules.flatMap((m) => m.lessons)
  const idsConcluidasSet = new Set(progresses.map((p) => p.lessonId))
  const indiceAtual = todasAulas.findIndex((a) => a.id === aulaId)
  const aulaAnterior = todasAulas[indiceAtual - 1] ?? null
  const proximaAula = todasAulas[indiceAtual + 1] ?? null
  const totalAulas = todasAulas.length
  const totalConcluidas = todasAulas.filter((a) => idsConcluidasSet.has(a.id)).length
  const progresso = totalAulas > 0 ? Math.round((totalConcluidas / totalAulas) * 100) : 0

  return (
    <div className="aula-layout" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <PomodoroWidget lessonId={aulaId} />

      {/* ── SIDEBAR ESQUERDA ── */}
      <AulaSidebar>
        {/* Cabeçalho sidebar */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <Link href={`/cursos/${cursoId}`} style={{ fontSize: 11, color: '#7c8ca0', textDecoration: 'none', letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            ← Voltar ao curso
          </Link>
          <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: '#e2e8f0', marginBottom: 12 }}>{curso.title}</p>
          {/* Progresso */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7c8ca0', marginBottom: 6 }}>
            <span>{totalConcluidas}/{totalAulas} atividades</span>
            <span>{progresso}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progresso}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 2, transition: 'width .5s' }} />
          </div>
        </div>

        {/* Lista de módulos e aulas */}
        <div style={{ flex: 1 }}>
          {curso.modules.map((modulo, mi) => (
            <div key={modulo.id}>
              <div style={{ padding: '14px 20px 10px', background: 'rgba(255,255,255,.03)', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#7c8ca0', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Módulo {mi + 1} — {modulo.title}
                </p>
              </div>
              {modulo.lessons.map((l, li) => {
                const lConcluida = idsConcluidasSet.has(l.id)
                const isAtual = l.id === aulaId
                const tipo = (l as { lessonType?: string }).lessonType ?? 'VIDEO'
                return (
                  <Link
                    key={l.id}
                    href={`/cursos/${cursoId}/aulas/${l.id}`}
                    prefetch={false}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px',
                      textDecoration: 'none',
                      background: isAtual ? 'rgba(99,102,241,.15)' : 'transparent',
                      borderLeft: isAtual ? '3px solid #6366f1' : '3px solid transparent',
                      transition: 'background .15s',
                    }}
                  >
                    {/* Ícone de status */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: lConcluida ? '#22c55e' : isAtual ? '#6366f1' : 'rgba(255,255,255,.06)',
                      border: lConcluida ? 'none' : isAtual ? 'none' : '1.5px solid rgba(255,255,255,.15)',
                      fontSize: 10,
                    }}>
                      {lConcluida ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <span style={{ color: isAtual ? 'white' : '#7c8ca0', fontSize: 9 }}>{ICON[tipo]}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, color: isAtual ? '#e2e8f0' : lConcluida ? '#7c8ca0' : '#a0aec0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {String(li + 1).padStart(2, '0')}. {l.title}
                      </p>
                      <p style={{ fontSize: 10, color: '#4a5568', marginTop: 2 }}>
                        {LABEL[tipo]}{(l as { duration?: string }).duration ? ` · ${(l as { duration?: string }).duration}` : ''}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </AulaSidebar>

      {/* ── ÁREA PRINCIPAL ── */}
      <div className="aula-main">

        {/* Header fixo */}
        <header style={{ height: 52, background: '#0f0f1a', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#4a5568', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {ICON[aula.lessonType]}
            </span>
            <span style={{ fontSize: 12, color: '#7c8ca0' }}>{aula.module.title}</span>
            <span style={{ color: '#2d3748', fontSize: 12 }}>›</span>
            <span style={{ fontSize: 12, color: '#a0aec0', fontWeight: 500 }}>{aula.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {aulaAnterior && (
              <Link href={`/cursos/${cursoId}/aulas/${aulaAnterior.id}`} style={{ fontSize: 12, color: '#7c8ca0', textDecoration: 'none', padding: '6px 14px', border: '1px solid rgba(255,255,255,.1)', borderRadius: 6 }}>
                ← Anterior
              </Link>
            )}
            {proximaAula && (
              <Link href={`/cursos/${cursoId}/aulas/${proximaAula.id}`} style={{ fontSize: 12, color: 'white', textDecoration: 'none', padding: '6px 16px', background: '#6366f1', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                Próxima atividade →
              </Link>
            )}
          </div>
        </header>

        {/* Conteúdo principal */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* ── VÍDEO ── */}
          {aula.lessonType === 'VIDEO' && (
            <div style={{ background: '#000', flexShrink: 0 }}>
              <div style={{ maxWidth: 960, margin: '0 auto', aspectRatio: '16/9', width: '100%' }}>
                {embedUrl ? (
                  <iframe
                    src={`${embedUrl}?rel=0&modestbranding=1`}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a5568', fontSize: 14 }}>
                    URL de vídeo inválida
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PDF / LEITURA ── */}
          {aula.lessonType === 'PDF' && aula.contentUrl && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <iframe
                src={aula.contentUrl}
                style={{ flex: 1, border: 'none', width: '100%', minHeight: 600, background: '#fff' }}
                title={aula.title}
              />
            </div>
          )}

          {/* ── QUIZ ── */}
          {aula.lessonType === 'QUIZ' && aula.contentUrl && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#13131f' }}>
              <div style={{ padding: '32px 32px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)', padding: '6px 14px', borderRadius: 6, marginBottom: 12 }}>
                  <span style={{ fontSize: 12 }}>✏️</span>
                  <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase' }}>Quiz</span>
                </div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{aula.title}</h1>
                {aula.description && <p style={{ fontSize: 14, color: '#7c8ca0', marginTop: 8, lineHeight: 1.6 }}>{aula.description}</p>}
              </div>
              <iframe
                src={aula.contentUrl}
                style={{ flex: 1, border: 'none', width: '100%', minHeight: 600 }}
                title={aula.title}
              />
            </div>
          )}

          {/* ── PAINEL INFERIOR (info + ações) ── */}
          <div style={{ background: '#13131f', borderTop: '1px solid rgba(255,255,255,.07)', padding: '24px 32px' }}>
            <div style={{ maxWidth: 860, margin: '0 auto' }}>

              {/* Título + botão concluir */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
                <div>
                  {aula.lessonType === 'VIDEO' && (
                    <>
                      <p style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>{aula.module.title}</p>
                      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.3 }}>{aula.title}</h1>
                    </>
                  )}
                </div>
                <BotaoConcluida concluida={concluida} lessonId={aulaId} cursoId={cursoId} />
              </div>

              {aula.lessonType === 'VIDEO' && aula.description && (
                <p style={{ fontSize: 14, color: '#7c8ca0', lineHeight: 1.7, marginBottom: 24 }}>{aula.description}</p>
              )}

              {/* Materiais */}
              {aula.attachments.length > 0 && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#a0aec0', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 12 }}>📎 Materiais desta aula</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {aula.attachments.map((anexo) => (
                      <a
                        key={anexo.id}
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 6, textDecoration: 'none', color: '#a0aec0', fontSize: 13 }}
                      >
                        <span style={{ fontSize: 16 }}>
                          {anexo.type === 'PDF' ? '📄' : anexo.type === 'IMAGE' ? '🖼️' : anexo.type === 'FILE' ? '📁' : '🔗'}
                        </span>
                        <span style={{ flex: 1 }}>{anexo.name}</span>
                        <span style={{ fontSize: 11, color: '#4a5568' }}>
                          {anexo.type === 'PDF' ? 'Baixar PDF' : anexo.type === 'IMAGE' ? 'Ver imagem' : anexo.type === 'FILE' ? 'Baixar' : 'Abrir'}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas pessoais */}
              <NotasPessoais lessonId={aulaId} conteudoInicial={nota?.content ?? ''} />

              {/* Comentários */}
              <div style={{ marginTop: 32 }}>
                <Comentarios lessonId={aulaId} cursoId={cursoId} comentarios={aula.comments} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
