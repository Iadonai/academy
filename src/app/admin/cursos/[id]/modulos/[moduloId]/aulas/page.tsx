import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { criarAula, editarAula, excluirAula, adicionarLink, excluirAnexo } from '@/app/actions/admin'
import { youtubeEmbedUrl } from '@/lib/youtube'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BotaoExcluir } from '@/components/admin/BotaoExcluir'

const TIPO_LABEL: Record<string, string> = { VIDEO: '▶ Vídeo', PDF: '📄 PDF / Leitura', QUIZ: '✏️ Quiz' }

export default async function AulasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; moduloId: string }>
  searchParams: Promise<{ erro?: string; detalhe?: string }>
}) {
  await verificarAdmin()
  const { id, moduloId } = await params
  const { erro, detalhe } = await searchParams

  const modulo = await prisma.module.findUnique({
    where: { id: moduloId },
    include: {
      course: { select: { id: true, title: true } },
      lessons: {
        orderBy: { order: 'asc' },
        include: { attachments: { orderBy: { createdAt: 'asc' } } },
      },
    },
  })

  if (!modulo || modulo.courseId !== id) notFound()

  return (
    <div className="p-8 max-w-3xl">
      {erro && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {erro === 'upload-falhou' && `❌ Falha no upload. ${detalhe ?? 'Verifique se o bucket "lesson-attachments" existe no Supabase Storage e está público.'}`}
          {erro === 'arquivo-vazio' && '❌ Arquivo vazio. Selecione um arquivo válido.'}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Link href="/admin/cursos" className="text-sm text-slate-500 hover:text-slate-700">← Cursos</Link>
        <span className="text-slate-300">/</span>
        <Link href={`/admin/cursos/${id}/modulos`} className="text-sm text-slate-500 hover:text-slate-700 truncate max-w-xs">
          {modulo.course.title}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500 truncate max-w-xs">{modulo.title}</span>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Atividades</h1>
      </div>

      {/* ── Formulário nova atividade ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">Adicionar atividade</h2>
        <form action={criarAula} className="space-y-3">
          <input type="hidden" name="moduleId" value={modulo.id} />
          <input type="hidden" name="courseId" value={id} />

          <div className="space-y-1.5">
            <Label>Tipo de atividade</Label>
            <select
              name="lessonType"
              defaultValue="VIDEO"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="VIDEO">▶ Vídeo</option>
              <option value="PDF">📄 PDF / Leitura</option>
              <option value="QUIZ">✏️ Quiz</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Título da atividade</Label>
            <Input name="title" placeholder="Ex: Estratégias de Chunking" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>URL do YouTube <span className="text-slate-400 font-normal">(se vídeo)</span></Label>
              <Input name="youtubeUrl" placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div className="space-y-1.5">
              <Label>URL do conteúdo <span className="text-slate-400 font-normal">(PDF ou quiz embed)</span></Label>
              <Input name="contentUrl" placeholder="https://docs.google.com/forms/..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Duração <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input name="duration" placeholder="Ex: 15min" />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição <span className="text-slate-400 font-normal">(opcional)</span></Label>
              <Input name="description" placeholder="Breve descrição..." />
            </div>
          </div>

          <Button type="submit">+ Adicionar atividade</Button>
        </form>
      </div>

      {/* ── Lista de atividades ── */}
      {modulo.lessons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          Nenhuma atividade ainda. Adicione a primeira acima.
        </div>
      ) : (
        <div className="space-y-6">
          {modulo.lessons.map((aula) => {
            const tipo = aula.lessonType ?? 'VIDEO'
            const embedUrl = tipo === 'VIDEO' ? youtubeEmbedUrl(aula.youtubeUrl) : null
            return (
              <div key={aula.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {/* Badge tipo + ordem */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {TIPO_LABEL[tipo]}
                  </span>
                  <span className="text-xs text-slate-400">Ordem: {aula.order}</span>
                  {aula.duration && <span className="text-xs text-slate-400">· {aula.duration}</span>}
                </div>

                {/* Preview vídeo */}
                {tipo === 'VIDEO' && embedUrl && (
                  <div className="aspect-video w-full bg-black">
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen />
                  </div>
                )}

                {/* Preview PDF */}
                {tipo === 'PDF' && aula.contentUrl && (
                  <div className="p-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                    <span>📄</span>
                    <a href={aula.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate">
                      {aula.contentUrl}
                    </a>
                  </div>
                )}

                {/* Preview Quiz */}
                {tipo === 'QUIZ' && aula.contentUrl && (
                  <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                    <span>✏️</span>
                    <a href={aula.contentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline truncate">
                      {aula.contentUrl}
                    </a>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <form action={editarAula} className="flex-1 space-y-2">
                      <input type="hidden" name="id" value={aula.id} />
                      <input type="hidden" name="moduleId" value={modulo.id} />
                      <input type="hidden" name="courseId" value={id} />

                      <div className="flex items-center gap-2">
                        <select
                          name="lessonType"
                          defaultValue={tipo}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="VIDEO">▶ Vídeo</option>
                          <option value="PDF">📄 PDF</option>
                          <option value="QUIZ">✏️ Quiz</option>
                        </select>
                        <Input name="title" defaultValue={aula.title} className="h-8 text-sm flex-1" required />
                        <Input name="duration" defaultValue={aula.duration ?? ''} className="h-8 text-sm w-20" placeholder="15min" />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Input name="youtubeUrl" defaultValue={aula.youtubeUrl} className="h-8 text-sm" placeholder="URL YouTube (se vídeo)" />
                        <Input name="contentUrl" defaultValue={aula.contentUrl ?? ''} className="h-8 text-sm" placeholder="URL PDF / Quiz embed" />
                      </div>

                      <Input name="description" defaultValue={aula.description ?? ''} className="h-8 text-sm" placeholder="Descrição (opcional)" />

                      <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">💾 Salvar</Button>
                    </form>
                    <BotaoExcluir
                      action={excluirAula}
                      fields={{ id: aula.id, moduleId: modulo.id, courseId: id }}
                      mensagem="Excluir esta atividade?"
                    />
                  </div>

                  {/* Anexos */}
                  {aula.attachments.length > 0 && (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Anexos</p>
                      {aula.attachments.map((anexo) => (
                        <div key={anexo.id} className="flex items-center gap-2 text-sm">
                          <span className="text-slate-400">{anexo.type === 'PDF' ? '📄' : '🔗'}</span>
                          <a href={anexo.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-primary hover:underline truncate">{anexo.name}</a>
                          <BotaoExcluir action={excluirAnexo} fields={{ id: anexo.id, moduleId: modulo.id, courseId: id }} mensagem={`Excluir "${anexo.name}"?`} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Adicionar link */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Adicionar link</p>
                    <form action={adicionarLink} className="flex gap-2 flex-wrap">
                      <input type="hidden" name="lessonId" value={aula.id} />
                      <input type="hidden" name="moduleId" value={modulo.id} />
                      <input type="hidden" name="courseId" value={id} />
                      <Input name="name" placeholder="Nome do link" className="h-8 text-sm w-40" required />
                      <Input name="url" placeholder="https://..." className="h-8 text-sm flex-1" required />
                      <Button type="submit" variant="outline" size="sm">+ Link</Button>
                    </form>
                  </div>

                  {/* Adicionar arquivo */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Adicionar arquivo</p>
                    <form method="POST" action="/api/upload-anexo" encType="multipart/form-data" className="flex gap-2 flex-wrap">
                      <input type="hidden" name="lessonId" value={aula.id} />
                      <input type="hidden" name="moduleId" value={modulo.id} />
                      <input type="hidden" name="courseId" value={id} />
                      <Input name="name" placeholder="Nome do arquivo" className="h-8 text-sm w-40" required />
                      <input type="file" name="file" required className="text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50" />
                      <Button type="submit" variant="outline" size="sm">+ Arquivo</Button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
