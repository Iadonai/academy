'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verificarAdmin } from '@/lib/admin'
import { createClient } from '@/lib/supabase/server'

// ── Cursos ───────────────────────────────────────────────────────────────────

export async function criarCurso(formData: FormData) {
  await verificarAdmin()

  const curso = await prisma.course.create({
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || 0,
      isSubscriptionOnly: formData.get('isSubscriptionOnly') === 'true',
      published: false,
    },
  })

  redirect(`/admin/cursos/${curso.id}/modulos`)
}

export async function editarCurso(formData: FormData) {
  await verificarAdmin()

  const id = formData.get('id') as string
  const thumbnail = formData.get('thumbnail') as File | null

  let thumbnailUrl: string | undefined

  if (thumbnail && thumbnail.size > 0) {
    const supabase = await createClient()

    const ext = thumbnail.name.split('.').pop()
    const caminho = `${id}/thumbnail.${ext}`

    const { error } = await supabase.storage
      .from('course-thumbnails')
      .upload(caminho, thumbnail, { contentType: thumbnail.type, upsert: true })

    if (!error) {
      const { data } = supabase.storage.from('course-thumbnails').getPublicUrl(caminho)
      thumbnailUrl = `${data.publicUrl}?t=${Date.now()}`
    }
  }

  await prisma.course.update({
    where: { id },
    data: {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string) || 0,
      isSubscriptionOnly: formData.get('isSubscriptionOnly') === 'true',
      published: formData.get('published') === 'true',
      kiwifyProductId: (formData.get('kiwifyProductId') as string) || null,
      kiwifyCheckoutUrl: (formData.get('kiwifyCheckoutUrl') as string) || null,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
    },
  })

  redirect(`/admin/cursos/${id}/modulos`)
}

export async function excluirCurso(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.course.delete({ where: { id } })
  redirect('/admin/cursos')
}

export async function alternarPublicacao(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  const published = formData.get('published') === 'true'
  await prisma.course.update({ where: { id }, data: { published: !published } })
  redirect('/admin/cursos')
}

// ── Módulos ──────────────────────────────────────────────────────────────────

export async function criarModulo(formData: FormData) {
  await verificarAdmin()

  const courseId = formData.get('courseId') as string

  const ultimo = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  await prisma.module.create({
    data: {
      courseId,
      title: formData.get('title') as string,
      order: (ultimo?.order ?? 0) + 1,
    },
  })

  redirect(`/admin/cursos/${courseId}/modulos`)
}

export async function editarModulo(formData: FormData) {
  await verificarAdmin()

  const id = formData.get('id') as string
  const courseId = formData.get('courseId') as string

  await prisma.module.update({
    where: { id },
    data: { title: formData.get('title') as string },
  })

  redirect(`/admin/cursos/${courseId}/modulos`)
}

export async function excluirModulo(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  const courseId = formData.get('courseId') as string
  await prisma.module.delete({ where: { id } })
  redirect(`/admin/cursos/${courseId}/modulos`)
}

// ── Aulas ─────────────────────────────────────────────────────────────────────

export async function criarAula(formData: FormData) {
  await verificarAdmin()

  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string

  const ultima = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: 'desc' },
    select: { order: true },
  })

  const lessonType = (formData.get('lessonType') as string) || 'VIDEO'

  await prisma.lesson.create({
    data: {
      moduleId,
      title: formData.get('title') as string,
      lessonType: lessonType as 'VIDEO' | 'PDF' | 'QUIZ',
      youtubeUrl: lessonType === 'VIDEO' ? (formData.get('youtubeUrl') as string) || '' : '',
      contentUrl: lessonType !== 'VIDEO' ? (formData.get('contentUrl') as string) || null : null,
      duration: (formData.get('duration') as string) || null,
      description: (formData.get('description') as string) || null,
      order: (ultima?.order ?? 0) + 1,
    },
  })

  redirect(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
}

export async function editarAula(formData: FormData) {
  await verificarAdmin()

  const id = formData.get('id') as string
  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string

  const lessonType = (formData.get('lessonType') as string) || 'VIDEO'

  await prisma.lesson.update({
    where: { id },
    data: {
      title: formData.get('title') as string,
      lessonType: lessonType as 'VIDEO' | 'PDF' | 'QUIZ',
      youtubeUrl: lessonType === 'VIDEO' ? (formData.get('youtubeUrl') as string) || '' : '',
      contentUrl: lessonType !== 'VIDEO' ? (formData.get('contentUrl') as string) || null : null,
      duration: (formData.get('duration') as string) || null,
      description: (formData.get('description') as string) || null,
    },
  })

  redirect(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
}

export async function excluirAula(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string
  await prisma.lesson.delete({ where: { id } })
  redirect(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
}

// ── Anexos ────────────────────────────────────────────────────────────────────

export async function adicionarLink(formData: FormData) {
  await verificarAdmin()

  const lessonId = formData.get('lessonId') as string
  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string

  const anexo = await prisma.lessonAttachment.create({
    data: {
      lessonId,
      name: formData.get('name') as string,
      type: 'LINK',
      url: formData.get('url') as string,
    },
  })

  // Busca o cursoId real da aula para revalidar a view do aluno
  const aula = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { module: { select: { courseId: true } } } })
  if (aula) revalidatePath(`/cursos/${aula.module.courseId}/aulas/${lessonId}`)

  redirect(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
}

export async function adicionarArquivo(formData: FormData) {
  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string
  const base = `/admin/cursos/${courseId}/modulos/${moduleId}/aulas`

  try {
    await verificarAdmin()

    const file = formData.get('file') as File
    const lessonId = formData.get('lessonId') as string
    const name = (formData.get('name') as string) || file?.name || 'Arquivo'

    if (!file || file.size === 0) redirect(`${base}?erro=arquivo-vazio`)

    const supabase = await createClient()
    const ext = file.name.split('.').pop()
    const caminho = `${lessonId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('lesson-attachments')
      .upload(caminho, file, { contentType: file.type || 'application/octet-stream' })

    if (uploadError) redirect(`${base}?erro=upload-falhou&detalhe=${encodeURIComponent(uploadError.message)}`)

    const { data: urlData } = supabase.storage.from('lesson-attachments').getPublicUrl(caminho)

    const tipo = file.type === 'application/pdf' ? 'PDF' : file.type.startsWith('image/') ? 'IMAGE' : 'FILE'

    await prisma.lessonAttachment.create({
      data: { lessonId, name, type: tipo, url: urlData.publicUrl },
    })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'digest' in e) throw e
    const msg = e instanceof Error ? e.message : String(e)
    redirect(`${base}?erro=upload-falhou&detalhe=${encodeURIComponent(msg)}`)
  }

  redirect(base)
}

/** @deprecated use adicionarArquivo */
export const adicionarPdf = adicionarArquivo

export async function excluirAnexo(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  const moduleId = formData.get('moduleId') as string
  const courseId = formData.get('courseId') as string
  await prisma.lessonAttachment.delete({ where: { id } })
  redirect(`/admin/cursos/${courseId}/modulos/${moduleId}/aulas`)
}

// ── Configurações ─────────────────────────────────────────────────────────────

export async function salvarConfig(formData: FormData) {
  await verificarAdmin()

  const entries = Array.from(formData.entries()) as [string, string][]

  for (const [key, value] of entries) {
    await prisma.platformConfig.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    })
  }

  revalidatePath('/admin/configuracoes')
}

// ── Canais do Fórum ───────────────────────────────────────────────────────────

export async function criarCanal(formData: FormData) {
  await verificarAdmin()

  const ultimo = await prisma.channel.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })

  await prisma.channel.create({
    data: {
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || null,
      order: (ultimo?.order ?? 0) + 1,
    },
  })

  revalidatePath('/comunidade')
  redirect('/admin/comunidade')
}

export async function excluirCanal(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.channel.delete({ where: { id } })
  redirect('/admin/comunidade')
}

// ── Lives ─────────────────────────────────────────────────────────────────────

export async function criarLive(formData: FormData) {
  await verificarAdmin()

  const title = formData.get('title') as string
  const description = (formData.get('description') as string) || null
  const youtubeUrl = formData.get('youtubeUrl') as string
  const scheduledAt = new Date(formData.get('scheduledAt') as string)

  await prisma.liveEvent.create({
    data: { title, description, youtubeUrl, scheduledAt },
  })

  revalidatePath('/lives')
  redirect('/admin/lives')
}

export async function excluirLive(formData: FormData) {
  await verificarAdmin()
  const id = formData.get('id') as string
  await prisma.liveEvent.delete({ where: { id } })
  redirect('/admin/lives')
}
