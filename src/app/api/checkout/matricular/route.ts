import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { cursoId } = await request.json().catch(() => ({}))
  if (!cursoId) return NextResponse.json({ error: 'Curso inválido' }, { status: 400 })

  const curso = await prisma.course.findUnique({
    where: { id: cursoId },
    select: { price: true, published: true },
  })

  if (!curso || !curso.published) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  if (Number(curso.price) !== 0) {
    return NextResponse.json({ error: 'Curso não é gratuito' }, { status: 400 })
  }

  await prisma.courseAccess.upsert({
    where: { userId_courseId: { userId: user.id, courseId: cursoId } },
    create: { userId: user.id, courseId: cursoId, type: 'PURCHASE' },
    update: {},
  })

  return NextResponse.json({ redirect: `/cursos/${cursoId}` })
}
