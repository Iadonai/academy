import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { criarLive, excluirLive } from '@/app/actions/admin'
import { BotaoExcluir } from '@/components/admin/BotaoExcluir'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function AdminLivesPage() {
  await verificarAdmin()

  const lives = await prisma.liveEvent.findMany({ orderBy: { scheduledAt: 'desc' } })

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Lives & Eventos</h1>

      <form action={criarLive} className="rounded-xl border border-slate-200 bg-white p-6 mb-8 space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Agendar nova live</h2>
        <div className="space-y-1">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" placeholder="Ex: Aula ao vivo — Python Avançado" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input id="description" name="description" placeholder="Sobre o que será esta live?" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="youtubeUrl">Link do YouTube (live ou vídeo)</Label>
          <Input id="youtubeUrl" name="youtubeUrl" placeholder="https://youtube.com/live/..." required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="scheduledAt">Data e hora</Label>
          <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
        </div>
        <Button type="submit">Agendar live</Button>
      </form>

      {lives.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400 text-sm">
          Nenhuma live agendada ainda.
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Título</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Data</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lives.map((live) => (
                <tr key={live.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{live.title}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(live.scheduledAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 flex justify-end">
                    <BotaoExcluir action={excluirLive} fields={{ id: live.id }} mensagem={`Excluir a live "${live.title}"?`} />
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
