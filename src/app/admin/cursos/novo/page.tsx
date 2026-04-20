import { verificarAdmin } from '@/lib/admin'
import { criarCurso } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default async function NovoCursoPage() {
  await verificarAdmin()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cursos" className="text-sm text-slate-500 hover:text-slate-700">
          ← Cursos
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Novo curso</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form action={criarCurso} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" placeholder="Ex: Inteligência Artificial para Iniciantes" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Descreva o que o aluno vai aprender..."
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input id="price" name="price" type="number" min="0" step="0.01" placeholder="0.00" />
            <p className="text-xs text-slate-400">Deixe 0 se o acesso for apenas por assinatura.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="isSubscriptionOnly">Acesso</Label>
            <select
              id="isSubscriptionOnly"
              name="isSubscriptionOnly"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="false">Compra avulsa ou assinatura</option>
              <option value="true">Somente assinatura</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skill">Categoria / Habilidade</Label>
            <select
              id="skill"
              name="skill"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Sem categoria</option>
              <option value="Python">Python</option>
              <option value="Power BI">Power BI</option>
              <option value="Dados">Dados</option>
              <option value="IA">IA</option>
              <option value="Automação">Automação</option>
              <option value="Negócios">Negócios</option>
            </select>
            <p className="text-xs text-slate-400">Aparece no radar de habilidades do aluno ao concluir o curso.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" className="w-full">Criar curso e adicionar módulos →</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
