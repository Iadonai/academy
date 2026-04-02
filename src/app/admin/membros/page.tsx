import { verificarAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import { aprovarMembro, rejeitarMembro, banirMembro, reativarMembro, gerarConvite, excluirConvite } from '@/app/actions/membros'
import { createClient } from '@/lib/supabase/server'
import { BotaoCopiar } from '@/components/admin/BotaoCopiar'

export default async function AdminMembrosPage() {
  await verificarAdmin()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [membros, convites] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, status: true, xpTotal: true, level: true, createdAt: true },
    }),
    prisma.invite.findMany({
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { name: true } } },
    }),
  ])

  const pendentes = membros.filter(m => m.status === 'PENDING')
  const ativos = membros.filter(m => m.status === 'ACTIVE')
  const banidos = membros.filter(m => m.status === 'BANNED')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Gerenciar Membros</h1>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ativos', count: ativos.length, cor: 'text-green-600' },
          { label: 'Pendentes', count: pendentes.length, cor: 'text-yellow-600' },
          { label: 'Banidos', count: banidos.length, cor: 'text-red-600' },
        ].map(({ label, count, cor }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <div className={`text-3xl font-bold ${cor}`}>{count}</div>
            <div className="text-sm text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Pendentes */}
      {pendentes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Aguardando Aprovação ({pendentes.length})
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {pendentes.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-4 p-4 ${i < pendentes.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.email}</div>
                </div>
                <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</div>
                <div className="flex gap-2">
                  <form action={aprovarMembro}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded">
                      APROVAR
                    </button>
                  </form>
                  <form action={rejeitarMembro}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded">
                      REJEITAR
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ativos */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Membros Ativos ({ativos.length})
        </h2>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {ativos.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">Nenhum membro ativo.</p>
          ) : ativos.map((m, i) => (
            <div key={m.id} className={`flex items-center gap-4 p-4 ${i < ativos.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 truncate">{m.name}</span>
                  {m.role === 'ADMIN' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">ADMIN</span>
                  )}
                </div>
                <div className="text-xs text-slate-400">{m.email}</div>
              </div>
              <div className="text-xs text-slate-500 text-right">
                <div>Nível {m.level}</div>
                <div>{m.xpTotal} XP</div>
              </div>
              <div className="text-xs text-slate-400">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</div>
              {m.role !== 'ADMIN' && (
                <form action={banirMembro}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="px-3 py-1.5 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 text-xs font-medium rounded transition-colors">
                    BANIR
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Banidos */}
      {banidos.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            Banidos ({banidos.length})
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {banidos.map((m, i) => (
              <div key={m.id} className={`flex items-center gap-4 p-4 ${i < banidos.length - 1 ? 'border-b border-slate-100' : ''}`}>
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500 flex-shrink-0 opacity-50">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-500 truncate">{m.name}</div>
                  <div className="text-xs text-slate-400">{m.email}</div>
                </div>
                <form action={reativarMembro}>
                  <input type="hidden" name="id" value={m.id} />
                  <button type="submit" className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-medium rounded">
                    REATIVAR
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convites */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Convites</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          {/* Gerar convite */}
          <form action={gerarConvite} className="flex gap-3">
            <input
              name="email"
              type="email"
              placeholder="Email do convidado (opcional)"
              className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md">
              + GERAR CONVITE
            </button>
          </form>

          {/* Lista de convites */}
          {convites.length === 0 ? (
            <p className="text-sm text-slate-400">Nenhum convite gerado ainda.</p>
          ) : (
            <div className="space-y-2">
              {convites.map((convite) => (
                <div key={convite.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-slate-600 truncate">
                      {baseUrl}/cadastro?convite={convite.code}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {convite.email ? `Para: ${convite.email} · ` : ''}
                      {convite.usedAt
                        ? `✅ Usado por ${convite.usedByEmail ?? '—'}`
                        : '⏳ Não utilizado'}
                    </div>
                  </div>
                  {!convite.usedAt && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <BotaoCopiar texto={`${baseUrl}/cadastro?convite=${convite.code}`} />
                      <form action={excluirConvite}>
                        <input type="hidden" name="id" value={convite.id} />
                        <button type="submit" className="text-xs text-slate-400 hover:text-red-500">
                          EXCLUIR
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
