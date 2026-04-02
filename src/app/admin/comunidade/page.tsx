import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { criarCanal, excluirCanal } from '@/app/actions/admin'
import { BotaoExcluir } from '@/components/admin/BotaoExcluir'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function AdminComunidadePage() {
  await verificarAdmin()

  const canais = await prisma.channel.findMany({ orderBy: { order: 'asc' } })

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Canais da Comunidade</h1>

      {/* Formulário novo canal */}
      <form action={criarCanal} className="rounded-xl border border-slate-200 bg-white p-6 mb-8 space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Novo canal</h2>
        <div className="space-y-1">
          <Label htmlFor="name">Nome do canal</Label>
          <Input id="name" name="name" placeholder="ex: GERAL" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input id="description" name="description" placeholder="Sobre o que é este canal?" />
        </div>
        <Button type="submit">Criar canal</Button>
      </form>

      {/* Lista de canais */}
      {canais.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400 text-sm">
          Nenhum canal criado ainda.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Canal</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Descrição</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {canais.map((canal) => (
                <tr key={canal.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900"># {canal.name}</td>
                  <td className="px-4 py-3 text-slate-500">{canal.description ?? '—'}</td>
                  <td className="px-4 py-3 flex justify-end">
                    <BotaoExcluir
                      action={excluirCanal}
                      fields={{ id: canal.id }}
                      mensagem={`Excluir o canal #${canal.name} e todas as publicações?`}
                    />
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
