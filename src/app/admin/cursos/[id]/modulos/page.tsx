import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { criarModulo, editarModulo, excluirModulo } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BotaoExcluir } from '@/components/admin/BotaoExcluir'

export default async function ModulosPage({ params }: { params: Promise<{ id: string }> }) {
  await verificarAdmin()
  const { id } = await params

  const curso = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { lessons: true } } },
      },
    },
  })

  if (!curso) notFound()

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cursos" className="text-sm text-slate-500 hover:text-slate-700">
          ← Cursos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-500 truncate max-w-xs">{curso.title}</span>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Módulos</h1>
      </div>

      {/* Formulário novo módulo */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">Adicionar módulo</h2>
        <form action={criarModulo} className="flex gap-3">
          <input type="hidden" name="courseId" value={curso.id} />
          <div className="flex-1 space-y-1">
            <Label htmlFor="title" className="sr-only">Título do módulo</Label>
            <Input id="title" name="title" placeholder="Ex: Introdução ao curso" required />
          </div>
          <Button type="submit">Adicionar</Button>
        </form>
      </div>

      {/* Lista de módulos */}
      {curso.modules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
          Nenhum módulo ainda. Adicione o primeiro acima.
        </div>
      ) : (
        <div className="space-y-3">
          {curso.modules.map((modulo) => (
            <div
              key={modulo.id}
              className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-4"
            >
              <span className="text-slate-400 text-sm font-mono w-6 text-center">{modulo.order}</span>

              <div className="flex-1">
                <form action={editarModulo} className="flex gap-2">
                  <input type="hidden" name="id" value={modulo.id} />
                  <input type="hidden" name="courseId" value={curso.id} />
                  <Input name="title" defaultValue={modulo.title} className="h-8 text-sm" required />
                  <Button type="submit" variant="outline" size="sm">Salvar</Button>
                </form>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/cursos/${curso.id}/modulos/${modulo.id}/aulas`}>
                    {modulo._count.lessons} aula{modulo._count.lessons !== 1 ? 's' : ''}
                  </Link>
                </Button>
                <BotaoExcluir
                  action={excluirModulo}
                  fields={{ id: modulo.id, courseId: curso.id }}
                  mensagem="Excluir este módulo e todas as aulas?"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
