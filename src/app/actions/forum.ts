'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { concederXP } from '@/lib/xp'

async function getUsuario() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

function tipoArquivo(mimeType: string): 'IMAGE' | 'FILE' {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  return 'FILE'
}

export async function curtirPost(formData: FormData) {
  const user = await getUsuario()

  const postId = formData.get('postId') as string
  const channelId = formData.get('channelId') as string

  const existente = await prisma.postLike.findUnique({
    where: { userId_postId: { userId: user.id, postId } },
  })

  if (existente) {
    await prisma.postLike.delete({ where: { userId_postId: { userId: user.id, postId } } })
  } else {
    await prisma.postLike.create({ data: { userId: user.id, postId } })
  }

  revalidatePath(`/comunidade/${channelId}/${postId}`)
}

export async function criarPost(formData: FormData) {
  const user = await getUsuario()

  const channelId = formData.get('channelId') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string
  const videoUrl = (formData.get('videoUrl') as string) || null

  const post = await prisma.post.create({
    data: { channelId, userId: user.id, title, content, videoUrl },
  })

  // Upload de arquivos
  const files = formData.getAll('files') as File[]
  const arquivosValidos = files.filter((f) => f && f.size > 0)

  if (arquivosValidos.length > 0) {
    const supabase = await createClient()

    for (const file of arquivosValidos) {
      const ext = file.name.split('.').pop()
      const caminho = `${post.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      console.log('[forum] uploading:', file.name, file.type, file.size, 'bytes → path:', caminho)

      const { error } = await supabase.storage
        .from('post-attachments')
        .upload(caminho, file, { contentType: file.type })

      if (error) {
        console.error('[forum] upload error:', error.message)
      } else {
        const { data } = supabase.storage.from('post-attachments').getPublicUrl(caminho)
        console.log('[forum] public url:', data.publicUrl)

        await prisma.postAttachment.create({
          data: {
            postId: post.id,
            name: file.name,
            type: tipoArquivo(file.type),
            url: data.publicUrl,
          },
        })
      }
    }
  }

  await concederXP(user.id, `post_${post.id}`, 15)

  redirect(`/comunidade/${channelId}/${post.id}`)
}

export async function responderPost(formData: FormData) {
  const user = await getUsuario()

  const postId = formData.get('postId') as string
  const channelId = formData.get('channelId') as string
  const content = formData.get('content') as string

  const reply = await prisma.postReply.create({
    data: { postId, userId: user.id, content },
  })

  await concederXP(user.id, `reply_${reply.id}`, 5)

  revalidatePath(`/comunidade/${channelId}/${postId}`)
}

export async function excluirPost(formData: FormData) {
  const user = await getUsuario()

  const id = formData.get('id') as string
  const channelId = formData.get('channelId') as string

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  const post = await prisma.post.findUnique({ where: { id }, select: { userId: true } })

  if (!post) redirect(`/comunidade/${channelId}`)
  if (perfil?.role !== 'ADMIN' && post.userId !== user.id) redirect(`/comunidade/${channelId}`)

  await prisma.post.delete({ where: { id } })
  redirect(`/comunidade/${channelId}`)
}

export async function excluirResposta(formData: FormData) {
  const user = await getUsuario()

  const id = formData.get('id') as string
  const postId = formData.get('postId') as string
  const channelId = formData.get('channelId') as string

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  const reply = await prisma.postReply.findUnique({ where: { id }, select: { userId: true } })

  if (!reply) redirect(`/comunidade/${channelId}/${postId}`)
  if (perfil?.role !== 'ADMIN' && reply.userId !== user.id) redirect(`/comunidade/${channelId}/${postId}`)

  await prisma.postReply.delete({ where: { id } })
  revalidatePath(`/comunidade/${channelId}/${postId}`)
}
