import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { criarPost } from '@/app/actions/forum'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function NovoPostPage({
  params,
}: {
  params: Promise<{ canalId: string }>
}) {
  const { canalId } = await params

  const canal = await prisma.channel.findUnique({ where: { id: canalId } })
  if (!canal) notFound()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/comunidade/${canalId}`}
          className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          ← Voltar para #{canal.name}
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mt-2">Nova publicação</h1>
        <p className="text-sm text-slate-500">em #{canal.name}</p>
      </div>

      <form action={criarPost} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <input type="hidden" name="channelId" value={canalId} />

        <div className="space-y-1">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            name="title"
            placeholder="Sobre o que você quer falar?"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="content">Conteúdo</Label>
          <textarea
            id="content"
            name="content"
            rows={5}
            required
            placeholder="Descreva sua dúvida, experiência ou ideia..."
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Vídeo YouTube */}
        <div className="space-y-1">
          <Label htmlFor="videoUrl">Vídeo do YouTube (opcional)</Label>
          <Input
            id="videoUrl"
            name="videoUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          <p className="text-xs text-slate-400">Cole o link do YouTube — o vídeo aparecerá embedado no post</p>
        </div>

        {/* Imagens e arquivos */}
        <div className="space-y-1">
          <Label htmlFor="files">Imagens ou arquivos (opcional)</Label>
          <div className="rounded-lg border border-dashed border-slate-300 px-4 py-4 hover:border-slate-400 transition-colors">
            <input
              id="files"
              name="files"
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">
              Fotos, templates, PDFs, planilhas — vários de uma vez
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit">Publicar</Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/comunidade/${canalId}`}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
