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

  const [curso, perfil] = await Promise.all([
    prisma.course.findUnique({
      where: { id: cursoId },
      select: { id: true, title: true, price: true, thumbnailUrl: true, published: true },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, cpfCnpj: true },
    }),
  ])

  if (!curso || !curso.published) {
    return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: curso.id,
    title: curso.title,
    price: String(curso.price),
    thumbnailUrl: curso.thumbnailUrl,
    email: perfil?.email ?? user.email ?? '',
    cpfCnpj: perfil?.cpfCnpj ?? '',
  })
}
