import { notFound } from 'next/navigation'
import Link from 'next/link'
import { verificarAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { liberarAcessoPorId, revogarAcesso } from '@/app/actions/membros'

export default async function AdminMembroDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verificarAdmin()
  const { id } = await params

  const [membro, cursos, acessos, assinatura] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, xpTotal: true, level: true, createdAt: true },
    }),
    prisma.course.findMany({
      where: { published: true },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, price: true },
    }),
    prisma.courseAccess.findMany({
      where: { userId: id },
      select: { courseId: true },
    }),
    prisma.subscription.findFirst({
      where: { userId: id, status: 'ACTIVE' },
    }),
  ])

  if (!membro) notFound()

  const acessoIds = new Set(acessos.map(a => a.courseId))

  const comAcesso = cursos.filter(c => Number(c.price) === 0 || acessoIds.has(c.id) || !!assinatura)
  const semAcesso = assinatura
    ? []
    : cursos.filter(c => Number(c.price) > 0 && !acessoIds.has(c.id))

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <Link
        href="/admin/membros"
        className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
      >
        ← Membros
      </Link>

      {/* Cabeçalho do membro */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-slate-200 flex items-center justify-center text-xl font-bold text-slate-600 flex-shrink-0">
          {membro.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-slate-900">{membro.name}</span>
            {membro.role === 'ADMIN' && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">ADMIN</span>
            )}
            {assinatura && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">ASSINANTE</span>
            )}
          </div>
          <div className="text-sm text-slate-400">{membro.email}</div>
          <div className="text-xs text-slate-400 mt-1">
            Nível {membro.level} · {membro.xpTotal} XP · Membro desde {new Date(membro.createdAt).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
          </div>
        </div>
      </div>

      {assinatura && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Este aluno tem assinatura ativa — todos os cursos pagos estão liberados automaticamente.
        </div>
      )}

      {/* Cursos com acesso */}
      <div>
        <h2 className="text-base font-semibold text-slate-800 mb-3">
          Com acesso ({comAcesso.length})
        </h2>
        {comAcesso.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum curso liberado ainda.</p>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {comAcesso.map((curso, i) => {
              const ehGratuito = Number(curso.price) === 0
              const viaAssinatura = !!assinatura && !acessoIds.has(curso.id) && !ehGratuito
              return (
                <div
                  key={curso.id}
                  className={`flex items-center gap-4 p-4 ${i < comAcesso.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-slate-800">{curso.title}</span>
                  {ehGratuito && <span className="text-xs text-slate-400">gratuito</span>}
                  {viaAssinatura && <span className="text-xs text-blue-500">via assinatura</span>}
                  {!ehGratuito && !viaAssinatura && (
                    <form action={revogarAcesso}>
                      <input type="hidden" name="userId" value={membro.id} />
                      <input type="hidden" name="cursoId" value={curso.id} />
                      <button
                        type="submit"
                        className="px-3 py-1 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 text-xs font-medium rounded transition-colors"
                      >
                        REVOGAR
                      </button>
                    </form>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cursos sem acesso */}
      {!assinatura && (
        <div>
          <h2 className="text-base font-semibold text-slate-800 mb-3">
            Liberar acesso ({semAcesso.length})
          </h2>
          {semAcesso.length === 0 ? (
            <p className="text-sm text-slate-400">Todos os cursos já estão liberados.</p>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              {semAcesso.map((curso, i) => (
                <div
                  key={curso.id}
                  className={`flex items-center gap-4 p-4 ${i < semAcesso.length - 1 ? 'border-b border-slate-100' : ''}`}
                >
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm text-slate-500">{curso.title}</span>
                  <span className="text-xs text-slate-400">
                    R$ {Number(curso.price).toFixed(2).replace('.', ',')}
                  </span>
                  <form action={liberarAcessoPorId}>
                    <input type="hidden" name="userId" value={membro.id} />
                    <input type="hidden" name="cursoId" value={curso.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-medium rounded transition-colors"
                    >
                      LIBERAR
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
