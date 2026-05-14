'use client'

import { useRef, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

type Anexo = { id: string; name: string; type: string; url: string }

const ICONES: Record<string, string> = {
  PDF: '📄', IMAGE: '🖼️', LINK: '🔗', FILE: '📦',
}

function detectarTipo(nomeArquivo: string): string {
  const ext = nomeArquivo.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'PDF'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'IMAGE'
  return 'FILE'
}

export function AnexosAula({
  aulaId,
  anexos: iniciais,
  onAdd,
  onDelete,
}: {
  aulaId: string
  anexos: Anexo[]
  onAdd: (formData: FormData) => Promise<void>
  onDelete: (formData: FormData) => Promise<void>
}) {
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')
  const [aberto, setAberto] = useState(false)
  const [, startTransition] = useTransition()
  const hiddenFormRef = useRef<HTMLFormElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setErro('')

    const supabase = createClient()
    const caminho = `${aulaId}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from('lesson-attachments')
      .upload(caminho, file, { upsert: false })

    if (error) {
      setErro(`Erro ao enviar: ${error.message}`)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('lesson-attachments').getPublicUrl(caminho)
    const form = hiddenFormRef.current!
    ;(form.querySelector('[name=name]') as HTMLInputElement).value = file.name
    ;(form.querySelector('[name=url]') as HTMLInputElement).value = data.publicUrl
    ;(form.querySelector('[name=type]') as HTMLInputElement).value = detectarTipo(file.name)
    startTransition(() => { form.requestSubmit() })
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 6, padding: '7px 10px', color: '#fff', fontSize: 12, outline: 'none',
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        📎 Anexos ({iniciais.length}) {aberto ? '▲' : '▼'}
      </button>

      {aberto && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Lista de anexos existentes */}
          {iniciais.map((a) => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,.04)', borderRadius: 6, padding: '7px 10px',
            }}>
              <span style={{ fontSize: 14 }}>{ICONES[a.type] ?? '📎'}</span>
              <a href={a.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 12, color: '#5bc8ff', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.name}
              </a>
              <form action={onDelete}>
                <input type="hidden" name="id" value={a.id} />
                <input type="hidden" name="aulaId" value={aulaId} />
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(239,68,68,.6)', lineHeight: 1 }}>✕</button>
              </form>
            </div>
          ))}

          {/* Upload de arquivo */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: uploading ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.12)',
            borderRadius: 6, padding: '8px 12px', fontSize: 12, color: uploading ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.55)',
          }}>
            <span>{uploading ? '⏳' : '⬆️'}</span>
            <span>{uploading ? 'Enviando...' : 'Enviar arquivo (PDF, ZIP, JSON...)'}</span>
            <input ref={fileInputRef} type="file" accept=".pdf,.zip,.json,.csv,.xlsx,.docx,.mp3,.mp4,image/*" onChange={handleUpload} disabled={uploading} style={{ display: 'none' }} />
          </label>

          {erro && <span style={{ fontSize: 11, color: '#f87171' }}>{erro}</span>}

          {/* Adicionar por URL */}
          <form action={onAdd} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="hidden" name="aulaId" value={aulaId} />
            <input type="hidden" name="type" value="LINK" />
            <input name="name" required placeholder="Nome do link" style={{ ...inputStyle, flex: '0 0 160px' }} />
            <input name="url" required placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
            <button type="submit" style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 6, padding: '7px 12px', fontSize: 12, color: '#fff', cursor: 'pointer', flexShrink: 0,
            }}>
              + Link
            </button>
          </form>

          {/* Formulário oculto para submissão após upload de arquivo */}
          <form ref={hiddenFormRef} action={onAdd} style={{ display: 'none' }}>
            <input type="hidden" name="aulaId" value={aulaId} />
            <input type="hidden" name="name" />
            <input type="hidden" name="url" />
            <input type="hidden" name="type" />
          </form>

        </div>
      )}
    </div>
  )
}
