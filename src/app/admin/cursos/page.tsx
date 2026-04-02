import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { excluirCurso, alternarPublicacao } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { BotaoExcluir } from '@/components/admin/BotaoExcluir'

export default async function CursosPage() {
  await verificarAdmin()

  const cursos = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { modules: true } } },
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cursos</h1>
        <Button asChild>
          <Link href="/admin/cursos/novo">+ Novo curso</Link>
        </Button>
      </div>

      {cursos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
          Nenhum curso cadastrado ainda.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Módulos</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Preço</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cursos.map((curso) => (
                <tr key={curso.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{curso.title}</td>
                  <td className="px-4 py-3 text-slate-500">{curso._count.modules}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {curso.isSubscriptionOnly
                      ? 'Assinatura'
                      : `R$ ${Number(curso.price).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        curso.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {curso.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/cursos/${curso.id}`} target="_blank">👁 Visualizar</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/cursos/${curso.id}`}>Editar</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/cursos/${curso.id}/modulos`}>Módulos</Link>
                      </Button>
                      <form action={alternarPublicacao}>
                        <input type="hidden" name="id" value={curso.id} />
                        <input type="hidden" name="published" value={String(curso.published)} />
                        <Button
                          type="submit"
                          size="sm"
                          className={curso.published
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                          }
                        >
                          {curso.published ? 'Despublicar' : 'Publicar'}
                        </Button>
                      </form>
                      <BotaoExcluir
                        action={excluirCurso}
                        fields={{ id: curso.id }}
                        mensagem="Excluir este curso e todos os módulos e aulas?"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
