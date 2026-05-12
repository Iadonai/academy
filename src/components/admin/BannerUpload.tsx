'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { salvarUrlBanner } from '@/app/actions/admin'

export function BannerUpload({ bannerAtual, linkAtual }: { bannerAtual: string | null; linkAtual: string | null }) {
  const [preview, setPreview] = useState<string | null>(bannerAtual)
  const [link, setLink] = useState(linkAtual ?? '')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ok' | 'erro'>('idle')
  const [erro, setErro] = useState('')
  const [progresso, setProgresso] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]

    if (!file) {
      setStatus('uploading')
      await salvarUrlBanner(preview ?? '', link)
      setStatus('ok')
      return
    }

    setStatus('uploading')
    setProgresso(10)
    setErro('')

    try {
      const ext = file.name.split('.').pop() ?? 'jpg'

      // 1. Pede URL assinada ao servidor (arquivo não sobe aqui)
      const res = await fetch(`/api/admin/banner-signed-url?ext=${ext}`)
      if (!res.ok) throw new Error('Erro ao gerar URL de upload')
      const { token, path } = await res.json()
      setProgresso(30)

      // 2. Upload direto browser → Supabase (não passa pelo Vercel)
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from('course-thumbnails')
        .uploadToSignedUrl(path, token, file, { contentType: file.type })

      if (uploadError) throw new Error(uploadError.message)
      setProgresso(80)

      // 3. Pega URL pública
      const { data: urlData } = supabase.storage.from('course-thumbnails').getPublicUrl(path)
      const url = `${urlData.publicUrl}?t=${Date.now()}`

      // 4. Salva URL no banco via Server Action (só texto, sem arquivo)
      await salvarUrlBanner(url, link)
      setProgresso(100)
      setPreview(url)
      setStatus('ok')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro desconhecido')
      setStatus('erro')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Imagem do banner</label>
        {preview && (
          <div className="rounded-md overflow-hidden border border-slate-200 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Banner atual" className="w-full h-24 object-cover" />
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="flex w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border file:border-slate-200 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
        />
        <p className="text-xs text-slate-400">Proporção recomendada: 16:5 (ex: 1280×400px). PNG ou JPG. Qualquer tamanho.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Link ao clicar no banner</label>
        <input
          value={link}
          onChange={e => setLink(e.target.value)}
          placeholder="https://exemplo.com/oferta"
          className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-slate-400">Deixe vazio para o banner não ser clicável.</p>
      </div>

      {status === 'uploading' && (
        <div className="space-y-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progresso}%` }} />
          </div>
          <p className="text-xs text-slate-400">Enviando... {progresso}%</p>
        </div>
      )}

      {status === 'ok' && (
        <p className="text-xs text-green-600 font-medium">✓ Banner salvo com sucesso!</p>
      )}

      {status === 'erro' && (
        <p className="text-xs text-red-600">❌ {erro}</p>
      )}

      <button
        type="submit"
        disabled={status === 'uploading'}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-md"
      >
        {status === 'uploading' ? 'Enviando...' : 'Salvar banner'}
      </button>
    </form>
  )
}
