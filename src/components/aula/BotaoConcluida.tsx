'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { marcarConcluida, desmarcarConcluida } from '@/app/actions/aula'

interface Props {
  concluida: boolean
  lessonId: string
  cursoId: string
}

export function BotaoConcluida({ concluida, lessonId, cursoId }: Props) {
  const [marcada, setMarcada] = useState(concluida)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    const novoEstado = !marcada
    setMarcada(novoEstado)

    const formData = new FormData()
    formData.set('lessonId', lessonId)
    formData.set('cursoId', cursoId)

    startTransition(async () => {
      if (novoEstado) {
        await marcarConcluida(formData)
      } else {
        await desmarcarConcluida(formData)
      }
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-60 ${
        marcada
          ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
          : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
        marcada ? 'border-white bg-white' : 'border-slate-400'
      }`}>
        {marcada && (
          <svg className="w-2.5 h-2.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      {pending ? 'Salvando...' : marcada ? 'Concluída ✓' : 'Marcar como concluída'}
    </button>
  )
}
