'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function gerarCertificado(cursoId: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Verifica se o curso existe
  const curso = await prisma.course.findUnique({
    where: { id: cursoId },
    include: { modules: { include: { lessons: true } } },
  })
  if (!curso) throw new Error('Curso não encontrado')

  // Verifica progresso 100%
  const totalAulas = curso.modules.reduce((acc, m) => acc + m.lessons.length, 0)
  if (totalAulas === 0) throw new Error('Curso sem aulas')

  const progresses = await prisma.lessonProgress.findMany({
    where: { userId: user.id, lessonId: { in: curso.modules.flatMap((m) => m.lessons.map((l) => l.id)) } },
  })
  if (progresses.length < totalAulas) throw new Error('Curso não concluído')

  // Cria ou busca certificado existente
  const cert = await prisma.certificate.upsert({
    where: { userId_courseId: { userId: user.id, courseId: cursoId } },
    create: { userId: user.id, courseId: cursoId },
    update: {},
  })

  return cert.id
}
