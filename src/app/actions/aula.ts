'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { concederXP } from '@/lib/xp'
import { sendCAPIEvent } from '@/lib/capi'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user
}

export async function marcarConcluida(formData: FormData) {
  const user = await getUser()
  const lessonId = formData.get('lessonId') as string
  const cursoId = formData.get('cursoId') as string

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId },
    update: {},
  })

  // XP por aula
  await concederXP(user.id, `aula_concluida_${lessonId}`, 10)

  // Verificar se completou o módulo
  const aula = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { title: true, moduleId: true, module: { select: { courseId: true, lessons: { select: { id: true } } } } },
  })

  if (aula) {
    const idsModulo = aula.module.lessons.map((l) => l.id)
    const concluidasModulo = await prisma.lessonProgress.count({
      where: { userId: user.id, lessonId: { in: idsModulo } },
    })
    if (concluidasModulo === idsModulo.length) {
      await concederXP(user.id, `modulo_concluido_${aula.moduleId}`, 30)
    }

    // Verificar se completou o curso
    const todasAulas = await prisma.lesson.findMany({
      where: { module: { courseId: aula.module.courseId } },
      select: { id: true },
    })
    const todasIds = todasAulas.map((l) => l.id)
    const concluidasCurso = await prisma.lessonProgress.count({
      where: { userId: user.id, lessonId: { in: todasIds } },
    })
    if (concluidasCurso === todasIds.length) {
      await concederXP(user.id, `curso_concluido_${aula.module.courseId}`, 100)
    }
  }

  // Meta CAPI ViewContent — best-effort, não bloqueia
  const userRecord = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true },
  })
  if (userRecord) {
    sendCAPIEvent(
      'ViewContent',
      { email: userRecord.email, firstName: userRecord.name?.split(' ')[0] },
      { content_name: aula?.title, content_type: 'lesson', content_ids: [lessonId] }
    ).catch(() => {})
  }

  revalidatePath(`/cursos/${cursoId}/aulas/${lessonId}`)
  revalidatePath(`/cursos/${cursoId}`)
}

export async function desmarcarConcluida(formData: FormData) {
  const user = await getUser()
  const lessonId = formData.get('lessonId') as string
  const cursoId = formData.get('cursoId') as string

  await prisma.lessonProgress.deleteMany({
    where: { userId: user.id, lessonId },
  })

  revalidatePath(`/cursos/${cursoId}/aulas/${lessonId}`)
  revalidatePath(`/cursos/${cursoId}`)
}

export async function comentar(formData: FormData) {
  const user = await getUser()
  const lessonId = formData.get('lessonId') as string
  const cursoId = formData.get('cursoId') as string
  const content = (formData.get('content') as string).trim()

  if (!content) return

  const comment = await prisma.comment.create({
    data: { userId: user.id, lessonId, content },
  })

  await concederXP(user.id, `comentario_${comment.id}`, 5)

  revalidatePath(`/cursos/${cursoId}/aulas/${lessonId}`)
}
