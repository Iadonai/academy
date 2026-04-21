import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const perfil = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (perfil?.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })

  const { ordem } = await req.json() as { ordem: string[] }
  if (!Array.isArray(ordem)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })

  await prisma.$transaction(
    ordem.map((id, index) => prisma.course.update({ where: { id }, data: { order: index } }))
  )

  return NextResponse.json({ ok: true })
}
