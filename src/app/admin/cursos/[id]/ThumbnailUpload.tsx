'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ThumbnailUpload({
  cursoId,
  thumbnailUrl,
}: {
  cursoId: string
  thumbnailUrl: string | null
}) {
  const [url, setUrl] = useState(thumbnailUrl)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setErro('')

    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const caminho = `${cursoId}/thumbnail.${ext}`

    const { error } = await supabase.storage
      .from('course-thumbnails')
      .upload(caminho, file, { contentType: file.type, upsert: true })

    if (error) {
      setErro(`Erro ao enviar imagem: ${error.message}`)
      setLoading(false)
      return
    }

    const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(caminho)
    setUrl(`${data.publicUrl}?t=${Date.now()}`)
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      {url && (
        <img
          src={url}
          alt="Thumbnail atual"
          className="w-full h-36 object-cover rounded-md border border-slate-200"
        />
      )}
      <input type="hidden" name="thumbnailUrl" value={url ?? ''} />
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
        className="flex w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {loading && (
        <p className="text-xs text-slate-400">Enviando imagem...</p>
      )}
      {erro && (
        <p className="text-xs text-red-500">{erro}</p>
      )}
      <p className="text-xs text-slate-400">Recomendado: 1280×720px. JPG ou PNG.</p>
    </div>
  )
}
