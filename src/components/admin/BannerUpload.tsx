'use client'

import { useState, useRef } from 'react'
import { salvarUrlBanner } from '@/app/actions/admin'

// Redimensiona a imagem no browser antes de enviar (resolve limite 4.5MB do Vercel)
function resizeBanner(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_W = 1280
      const scale = img.width > MAX_W ? MAX_W / img.width : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas não suportado')); return }
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(objectUrl)
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Falha ao converter imagem'))
      }, 'image/jpeg', 0.88)
    }
    img.onerror = () => reject(new Error('Imagem inválida'))
    img.src = objectUrl
  })
}

export function BannerUpload({ bannerAtual, linkAtual }: { bannerAtual: string | null; linkAtual: string | null }) {
  const [preview, setPreview] = useState<string | null>(bannerAtual)
  const [link, setLink] = useState(linkAtual ?? '')
  const [status, setStatus] = useState<'idle' | 'uploading' | 'ok' | 'erro'>('idle')
  const [erro, setErro] = useState('')
  const [progresso, setProgresso] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  // Preview imediato ao selecionar arquivo
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const localUrl = URL.createObjectURL(file)
      setPreview(localUrl)
      setStatus('idle')
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]

    setStatus('uploading')
    setProgresso(5)
    setErro('')

    try {
      if (!file) {
        // Só salva o link
        await salvarUrlBanner(bannerAtual ?? '', link)
        setStatus('ok')
        return
      }

      setProgresso(15)

      // Redimensiona no browser (fica <500KB)
      const blob = await resizeBanner(file)
      setProgresso(35)

      const formData = new FormData()
      formData.append('banner_file', blob, 'banner.jpg')
      formData.append('hero_banner_link', link)

      const res = await fetch('/api/admin/upload-banner', { method: 'POST', body: formData })
      setProgresso(85)

      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? 'Erro no servidor')

      // Atualiza preview com a URL final do Supabase
      if (json.url) setPreview(json.url)
      setProgresso(100)
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
            <img src={preview} alt="Preview do banner" className="w-full h-32 object-cover" />
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="flex w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border file:border-slate-200 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50 cursor-pointer"
        />
        <p className="text-xs text-slate-400">Proporção recomendada: 16:5 (ex: 1280×400px). A imagem é redimensionada automaticamente.</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">Link ao clicar no banner</label>
        <input
          value={link}
          onChange={e => { setLink(e.target.value); setStatus('idle') }}
          placeholder="https://exemplo.com/oferta"
          className="flex w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <p className="text-xs text-slate-400">Deixe vazio para o banner não ser clicável.</p>
      </div>

      {status === 'uploading' && (
        <div className="space-y-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
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
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-medium rounded-md transition-colors"
      >
        {status === 'uploading' ? 'Enviando...' : 'Salvar banner'}
      </button>
    </form>
  )
}
