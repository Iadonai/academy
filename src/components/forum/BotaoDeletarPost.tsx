'use client'

import { excluirPost, excluirResposta } from '@/app/actions/forum'

export function BotaoDeletarPost({ postId, channelId }: { postId: string; channelId: string }) {
  return (
    <form action={excluirPost}>
      <input type="hidden" name="id" value={postId} />
      <input type="hidden" name="channelId" value={channelId} />
      <button
        type="submit"
        className="btn-danger"
        onClick={(e) => {
          if (!confirm('Excluir esta publicação e todas as respostas?')) e.preventDefault()
        }}
      >
        EXCLUIR
      </button>
    </form>
  )
}

export function BotaoDeletarResposta({ replyId, postId, channelId }: { replyId: string; postId: string; channelId: string }) {
  return (
    <form action={excluirResposta}>
      <input type="hidden" name="id" value={replyId} />
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="channelId" value={channelId} />
      <button
        type="submit"
        style={{ fontFamily: 'var(--font-m)', fontSize: '10px', color: 'var(--mg)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '.04em' }}
        onClick={(e) => {
          if (!confirm('Excluir este comentário?')) e.preventDefault()
        }}
      >
        EXCLUIR
      </button>
    </form>
  )
}
