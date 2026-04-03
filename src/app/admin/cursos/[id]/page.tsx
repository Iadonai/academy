import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { editarCurso } from '@/app/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
  await verificarAdmin()
  const { id } = await params

  const curso = await prisma.course.findUnique({ where: { id } })
  if (!curso) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cursos" className="text-sm text-slate-500 hover:text-slate-700">
          ← Cursos
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-xl font-bold text-slate-900">Editar curso</h1>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <form action={editarCurso} className="space-y-5">
          <input type="hidden" name="id" value={curso.id} />

          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" defaultValue={curso.title} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={curso.description}
              required
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label htmlFor="thumbnail">Thumbnail do curso</Label>
            {curso.thumbnailUrl && (
              <img
                src={curso.thumbnailUrl}
                alt="Thumbnail atual"
                className="w-full h-36 object-cover rounded-md border border-slate-200"
              />
            )}
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/*"
              className="flex w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
            <p className="text-xs text-slate-400">Recomendado: 1280×720px. JPG ou PNG.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              defaultValue={Number(curso.price).toFixed(2)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="isSubscriptionOnly">Acesso</Label>
            <select
              id="isSubscriptionOnly"
              name="isSubscriptionOnly"
              defaultValue={curso.isSubscriptionOnly ? 'true' : 'false'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="false">Compra avulsa ou assinatura</option>
              <option value="true">Somente assinatura</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="published">Status</Label>
            <select
              id="published"
              name="published"
              defaultValue={curso.published ? 'true' : 'false'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="false">Rascunho</option>
              <option value="true">Publicado</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="kiwifyProductId">ID do Produto na Kiwify</Label>
            <Input
              id="kiwifyProductId"
              name="kiwifyProductId"
              defaultValue={curso.kiwifyProductId ?? ''}
              placeholder="Ex: prod_abc123"
            />
            <p className="text-xs text-slate-400">Kiwify → seu produto → copie o ID. Usado para liberar acesso automaticamente após pagamento.</p>
          </div>

          <Button type="submit" className="w-full">Salvar alterações</Button>
        </form>
      </div>
    </div>
  )
}
