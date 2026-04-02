'use client'

import { useRef, useTransition } from 'react'
import { comentar } from '@/app/actions/aula'

interface Comentario {
  id: string
  content: string
  createdAt: Date
  user: { name: string; avatarUrl: string | null }
}

interface Props {
  lessonId: string
  cursoId: string
  comentarios: Comentario[]
}

export function Comentarios({ lessonId, cursoId, comentarios }: Props) {
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => {
      comentar(formData).then(() => formRef.current?.reset())
    })
  }

  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-slate-900 mb-4">
        Comentários ({comentarios.length})
      </h2>

      {/* Formulário */}
      <form ref={formRef} onSubmit={handleSubmit} className="mb-6">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input type="hidden" name="cursoId" value={cursoId} />
        <textarea
          name="content"
          rows={3}
          placeholder="Deixe seu comentário, dúvida ou feedback..."
          required
          className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {pending ? 'Enviando...' : 'Comentar'}
        </button>
      </form>

      {/* Lista */}
      {comentarios.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {comentarios.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-700 text-sm font-bold">
                {c.user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900">{c.user.name}</span>
                  <span className="text-xs text-slate-400" suppressHydrationWarning>
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
