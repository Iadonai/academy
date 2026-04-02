'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { curtirPost } from '@/app/actions/forum'

interface Props {
  postId: string
  channelId: string
  total: number
  curtido: boolean
}

export function BotaoCurtir({ postId, channelId, total, curtido }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    const formData = new FormData()
    formData.set('postId', postId)
    formData.set('channelId', channelId)
    startTransition(() => {
      curtirPost(formData).then(() => router.refresh())
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        fontFamily: 'var(--font-m)', fontSize: '11px', letterSpacing: '.06em',
        background: 'transparent',
        border: curtido ? '1px solid rgba(255,107,53,.4)' : '1px solid var(--bdr)',
        color: curtido ? 'var(--mg)' : 'var(--mt)',
        padding: '5px 12px',
        cursor: 'pointer',
        transition: 'all .15s',
        opacity: pending ? 0.6 : 1,
      }}
    >
      <span>{curtido ? '❤️' : '🤍'}</span>
      <span>{total}</span>
    </button>
  )
}
