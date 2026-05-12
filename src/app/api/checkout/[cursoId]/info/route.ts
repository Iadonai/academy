import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ cursoId: string }> }
) {
  const { cursoId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const [curso, perfil, acessos, assinatura, todosCursos] = await Promise.all([
    prisma.course.findUnique({
      where: { id: cursoId },
      select: { id: true, title: true, price: true, thumbnailUrl: true, published: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, cpfCnpj: true },
    }),
    prisma.courseAccess.findMany({
      where: { userId: user.id },
      select: { courseId: true },
    }),
    prisma.subscription.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    }),
    prisma.course.findMany({
      where: { id: { not: cursoId }, published: true, price: { gt: 0 } },
      select: { id: true, title: true, price: true, thumbnailUrl: true },
      orderBy: { order: 'asc' },
      take: 5,
    }),
  ])

  if (!curso || !curso.published) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  const idsComAcesso = new Set(acessos.map(a => a.courseId))
  // Se tem assinatura ativa, já tem acesso a tudo — sem bumps
  const bumps = assinatura ? [] : todosCursos.filter(c => !idsComAcesso.has(c.id))

  return NextResponse.json({
    id: curso.id,
    title: curso.title,
    price: String(curso.price),
    thumbnailUrl: curso.thumbnailUrl,
    email: perfil?.email ?? user.email ?? '',
    cpfCnpj: perfil?.cpfCnpj ?? '',
    bumps: bumps.map(c => ({
      id: c.id,
      title: c.title,
      price: String(c.price),
      thumbnailUrl: c.thumbnailUrl,
    })),
  })
}
