'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ThumbnailUploadInstrutor({
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
      setErro(`Erro ao enviar: ${error.message}`)
      setLoading(false)
      return
    }

    const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(caminho)
    setUrl(`${data.publicUrl}?t=${Date.now()}`)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {url ? (
        <img src={url} alt="Thumbnail" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,.1)' }} />
      ) : (
        <div style={{
          width: '100%', height: 160, borderRadius: 8,
          border: '2px dashed rgba(255,255,255,.1)',
          background: 'rgba(255,255,255,.03)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,.25)', fontSize: 13,
        }}>
          Sem thumbnail
        </div>
      )}

      <input type="hidden" name="thumbnailUrl" value={url ?? ''} />

      <label style={{
        display: 'flex', alignItems: 'center', gap: 10, cursor: loading ? 'not-allowed' : 'pointer',
        background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 8, padding: '9px 14px', fontSize: 13, color: loading ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.7)',
      }}>
        <span>📎</span>
        <span>{loading ? 'Enviando...' : 'Escolher imagem'}</span>
        <input type="file" accept="image/*" onChange={handleChange} disabled={loading} style={{ display: 'none' }} />
      </label>

      {erro && <span style={{ fontSize: 12, color: '#f87171' }}>{erro}</span>}
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,.25)' }}>Recomendado: 1280×720px. JPG ou PNG.</span>
    </div>
  )
}
