import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { youtubeEmbedUrl } from '@/lib/youtube'
import { BotaoConcluida } from '@/components/aula/BotaoConcluida'
import { Comentarios } from '@/components/aula/Comentarios'

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
    const acesso = await prisma.courseAccess.findFirst({
      where: { userId: user.id, courseId: cursoId },
    })
    const assinatura = await prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    })
    if (!acesso && !assinatura) redirect('/dashboard')
  }

  const [aula, progresses] = await Promise.all([
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
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Vídeo */}
        <div className="aspect-video w-full bg-black shrink-0">
          {embedUrl ? (
            <iframe
              src={`${embedUrl}?rel=0`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
              URL de vídeo inválida
            </div>
          )}
        </div>

        {/* Abas: Aula / Materiais */}
        <div className="flex-1 bg-white">
          <div className="max-w-3xl mx-auto px-6 py-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs text-slate-400 mb-1">{aula.module.title}</p>
                <h1 className="text-xl font-bold text-slate-900">{aula.title}</h1>
              </div>
              <Link href={`/cursos/${cursoId}`} className="text-sm text-slate-500 hover:text-slate-700 shrink-0">
                ← Ver curso
              </Link>
            </div>

            {/* Botão concluir + navegação */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <BotaoConcluida concluida={concluida} lessonId={aulaId} cursoId={cursoId} />
              <div className="flex gap-2 ml-auto">
                {aulaAnterior && (
                  <Link
                    href={`/cursos/${cursoId}/aulas/${aulaAnterior.id}`}
                    className="text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    ← Anterior
                  </Link>
                )}
                {proximaAula && (
                  <Link
                    href={`/cursos/${cursoId}/aulas/${proximaAula.id}`}
                    className="text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
                  >
                    Próxima →
                  </Link>
                )}
              </div>
            </div>

            {aula.description && (
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">{aula.description}</p>
            )}

            {/* Materiais para download */}
            {aula.attachments.length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h2 className="text-sm font-semibold text-slate-700 mb-3">📎 Materiais desta aula</h2>
                <div className="space-y-2">
                  {aula.attachments.map((anexo) => (
                    <a
                      key={anexo.id}
                      href={anexo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={anexo.type === 'PDF'}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <span className="text-xl shrink-0">{anexo.type === 'PDF' ? '📄' : '🔗'}</span>
                      <span className="text-sm text-slate-700 group-hover:text-blue-700 font-medium flex-1">
                        {anexo.name}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                        {anexo.type === 'PDF' ? 'Baixar PDF' : 'Abrir link'}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comentários */}
            <Comentarios
              lessonId={aulaId}
              cursoId={cursoId}
              comentarios={aula.comments}
            />
          </div>
        </div>
      </div>

      {/* Sidebar — lista de aulas */}
      <aside className="w-full lg:w-80 bg-slate-800 text-white flex flex-col lg:h-screen lg:sticky lg:top-0 overflow-hidden">
        <div className="px-4 py-4 border-b border-slate-700">
          <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Curso</p>
          <h2 className="font-semibold text-sm leading-snug mb-3">{curso.title}</h2>
          {/* Barra de progresso */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{totalConcluidas}/{totalAulas} aulas</span>
            <span>{progresso}%</span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {curso.modules.map((modulo) => (
            <div key={modulo.id}>
              <div className="px-4 py-2 bg-slate-700/50">
                <p className="text-xs font-medium text-slate-300">{modulo.title}</p>
              </div>
              {modulo.lessons.map((l) => {
                const lConcluida = idsConcluidasSet.has(l.id)
                const isAtual = l.id === aulaId
                return (
                  <Link
                    key={l.id}
                    href={`/cursos/${cursoId}/aulas/${l.id}`}
                    className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isAtual ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      lConcluida
                        ? 'border-green-400 bg-green-400'
                        : isAtual
                        ? 'border-white'
                        : 'border-slate-500'
                    }`}>
                      {lConcluida && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 leading-snug">{l.title}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
