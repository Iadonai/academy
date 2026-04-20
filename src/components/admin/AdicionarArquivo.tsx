'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AdicionarArquivo({ lessonId }: { lessonId: string }) {
  const [erro, setErro] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro(null)

    const formData = new FormData(e.currentTarget)
    formData.set('lessonId', lessonId)

    startTransition(async () => {
      const res = await fetch('/api/upload-anexo', { method: 'POST', body: formData })
      const json = await res.json()

      if (!res.ok || json.erro) {
        setErro(json.erro || 'Erro desconhecido')
        return
      }

      formRef.current?.reset()
      router.refresh()
    })
  }

  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Adicionar arquivo</p>
      {erro && (
        <p className="text-xs text-red-600 mb-2">❌ {erro}</p>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2 flex-wrap">
        <Input name="name" placeholder="Nome do arquivo" className="h-8 text-sm w-40" required />
        <input
          type="file"
          name="file"
          required
          className="text-sm text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border file:border-slate-200 file:text-sm file:bg-white file:text-slate-700 hover:file:bg-slate-50"
        />
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          {pending ? 'Enviando...' : '+ Arquivo'}
        </Button>
      </form>
    </div>
  )
}
