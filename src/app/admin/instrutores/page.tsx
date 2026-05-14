import { verificarAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function promoverInstrutor(formData: FormData) {
  'use server'
  await verificarAdmin()
  const userId = formData.get('userId') as string
  await prisma.user.update({ where: { id: userId }, data: { role: 'INSTRUCTOR' } })
  revalidatePath('/admin/instrutores')
}

async function removerInstrutor(formData: FormData) {
  'use server'
  await verificarAdmin()
  const userId = formData.get('userId') as string
  await prisma.user.update({ where: { id: userId }, data: { role: 'STUDENT' } })
  revalidatePath('/admin/instrutores')
}

async function publicarCurso(formData: FormData) {
  'use server'
  await verificarAdmin()
  const courseId = formData.get('courseId') as string
  await prisma.course.update({ where: { id: courseId }, data: { published: true } })
  revalidatePath('/admin/instrutores')
}

async function despublicarCurso(formData: FormData) {
  'use server'
  await verificarAdmin()
  const courseId = formData.get('courseId') as string
  await prisma.course.update({ where: { id: courseId }, data: { published: false } })
  revalidatePath('/admin/instrutores')
}

export default async function AdminInstrutoresPage() {
  await verificarAdmin()

  const [instrutores, candidatos, cursosPendentes] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'INSTRUCTOR' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, createdAt: true,
        instructorCourses: {
          select: { id: true, title: true, published: true, price: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true },
      take: 200,
    }),
    prisma.course.findMany({
      where: { published: false, instructorId: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, price: true, createdAt: true,
        instructor: { select: { name: true, email: true } },
        _count: { select: { modules: true } },
      },
    }),
  ])

  return (
    <div className="p-8 max-w-4xl space-y-10">
      <h1 className="text-2xl font-bold text-slate-900">Instrutores</h1>

      {/* Cursos pendentes de aprovação */}
      {cursosPendentes.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3">
            Aguardando aprovação
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">{cursosPendentes.length}</span>
          </h2>
          <div className="space-y-3">
            {cursosPendentes.map((c) => (
              <div key={c.id} className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 text-sm">{c.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    por {c.instructor?.name ?? '–'} · {c._count.modules} módulo{c._count.modules !== 1 ? 's' : ''} · R$ {Number(c.price).toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={publicarCurso}>
                    <input type="hidden" name="courseId" value={c.id} />
                    <button type="submit" className="px-3 py-1.5 text-xs font-semibold bg-green-600 text-white rounded-md hover:bg-green-700">
                      Aprovar
                    </button>
                  </form>
                  <form action={despublicarCurso}>
                    <input type="hidden" name="courseId" value={c.id} />
                    <button type="submit" className="px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-600 rounded-md hover:bg-slate-100">
                      Rejeitar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instrutores ativos */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Instrutores ativos ({instrutores.length})</h2>
        {instrutores.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum instrutor ainda.</p>
        ) : (
          <div className="space-y-4">
            {instrutores.map((u) => (
              <div key={u.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                  <form action={removerInstrutor}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" className="text-xs text-red-500 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50">
                      Remover acesso
                    </button>
                  </form>
                </div>
                {u.instructorCourses.length > 0 ? (
                  <div className="space-y-1.5">
                    {u.instructorCourses.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2">
                        <span className="flex-1">{c.title}</span>
                        <span>R$ {Number(c.price).toFixed(2).replace('.', ',')}</span>
                        <span className={`px-2 py-0.5 rounded-full font-medium ${c.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {c.published ? 'Publicado' : 'Pendente'}
                        </span>
                        {c.published ? (
                          <form action={despublicarCurso}>
                            <input type="hidden" name="courseId" value={c.id} />
                            <button type="submit" className="text-slate-500 hover:text-red-500 underline">Despublicar</button>
                          </form>
                        ) : (
                          <form action={publicarCurso}>
                            <input type="hidden" name="courseId" value={c.id} />
                            <button type="submit" className="text-green-600 hover:text-green-700 underline">Aprovar</button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Sem cursos cadastrados ainda.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Promover membro */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">Promover membro a instrutor</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <form action={promoverInstrutor} className="flex gap-3 items-center">
            <select name="userId" required className="flex-1 rounded-md border border-slate-300 text-sm px-3 py-2 bg-white text-slate-700 outline-none">
              <option value="">Selecione um membro...</option>
              {candidatos.map((u) => (
                <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
              ))}
            </select>
            <button type="submit" className="px-4 py-2 text-sm font-semibold bg-purple-600 text-white rounded-md hover:bg-purple-700">
              Promover
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
